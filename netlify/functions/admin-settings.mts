import type { Config } from "@netlify/functions";
import { database, settingsBundle } from "./_lib/db.mts";
import { requireAdmin } from "./_lib/auth.mts";
import { body, cleanText, fail, json, safeNumber, validDate, validTime } from "./_lib/http.mts";

type SettingsInput = Record<string, unknown> & {
  hours?: Array<Record<string, unknown>>; services?: Array<Record<string, unknown>>; addOns?: Array<Record<string, unknown>>;
};

export default async (request: Request) => {
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const db = database();
  try {
    if (request.method === "GET") return json(await settingsBundle());
    const input = await body<SettingsInput>(request);
    if (request.method === "POST") {
      if (input.action !== "add-block") return fail("Unknown settings action.");
      const date = cleanText(input.date, 10); const startTime = cleanText(input.startTime, 5); const endTime = cleanText(input.endTime, 5); const reason = cleanText(input.reason, 300);
      if (!validDate(date) || !validTime(startTime) || !validTime(endTime) || endTime <= startTime || !reason) return fail("Enter a valid date, time range, and reason.");
      await db.pool.query("INSERT INTO blocked_times (starts_at, ends_at, reason) VALUES ($1::timestamp,$2::timestamp,$3)", [`${date}T${startTime}`, `${date}T${endTime}`, reason]);
      return json(await settingsBundle(), 201);
    }
    if (request.method === "DELETE") {
      if (input.action !== "remove-block" || !input.id) return fail("Choose a blocked time to remove.");
      await db.pool.query("DELETE FROM blocked_times WHERE id=$1", [cleanText(input.id, 50)]);
      return json(await settingsBundle());
    }
    if (request.method !== "PUT") return fail("Method not allowed.", 405);
    if (!Array.isArray(input.hours) || input.hours.length !== 7 || !Array.isArray(input.services) || !Array.isArray(input.addOns)) return fail("Settings payload is incomplete.");
    const timezone = cleanText(input.timezone, 80);
    try { new Intl.DateTimeFormat("en", { timeZone: timezone }).format(); } catch { return fail("Choose a valid time zone."); }
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE admin_settings SET timezone=$1, lead_time_hours=$2, buffer_minutes=$3, payment_enabled=$4, tax_enabled=$5,
          deposit_percent=$6, estimated_tax_rate=$7, updated_at=now() WHERE id=1`,
        [timezone, safeNumber(input.leadTimeHours, 0, 336, 24), safeNumber(input.bufferMinutes, 0, 240, 30), Boolean(input.paymentEnabled), Boolean(input.taxEnabled),
          safeNumber(input.depositPercent, 0, 100, 25), safeNumber(input.estimatedTaxRate, 0, 100, 25)],
      );
      for (const hour of input.hours) {
        const weekday = safeNumber(hour.weekday, 0, 6, -1); const open = cleanText(hour.openTime, 5); const close = cleanText(hour.closeTime, 5);
        if (weekday < 0 || !validTime(open) || !validTime(close) || close <= open) throw new Error("Every business-hours row must have a valid opening and closing time.");
        await client.query("UPDATE business_hours SET enabled=$1, open_time=$2, close_time=$3 WHERE weekday=$4", [Boolean(hour.enabled), open, close, weekday]);
      }
      const allowedServices = new Set((await client.query("SELECT id FROM services")).rows.map((row: Record<string, unknown>) => String(row.id)));
      for (const service of input.services) {
        const id = cleanText(service.id, 80); if (!allowedServices.has(id)) continue;
        const price = service.basePriceCents == null ? null : Math.round(safeNumber(service.basePriceCents, 0, 10_000_000, 0));
        await client.query("UPDATE services SET base_price_cents=$1, duration_minutes=$2, active=$3, updated_at=now() WHERE id=$4", [price, Math.round(safeNumber(service.durationMinutes, 30, 1440, 120)), Boolean(service.active), id]);
      }
      const allowedAddOns = new Set((await client.query("SELECT id FROM add_ons")).rows.map((row: Record<string, unknown>) => String(row.id)));
      for (const addOn of input.addOns) {
        const id = cleanText(addOn.id, 80); if (!allowedAddOns.has(id)) continue;
        await client.query("UPDATE add_ons SET price_cents=$1, duration_minutes=$2, active=$3, updated_at=now() WHERE id=$4", [Math.round(safeNumber(addOn.priceCents, 0, 1_000_000, 0)), Math.round(safeNumber(addOn.durationMinutes, 0, 720, 0)), Boolean(addOn.active), id]);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK"); throw error;
    } finally { client.release(); }
    return json(await settingsBundle());
  } catch (error) {
    console.error("admin-settings", error);
    return fail(error instanceof Error ? error.message : "Unable to update settings.", 400);
  }
};

export const config: Config = { path: "/api/admin-settings" };
