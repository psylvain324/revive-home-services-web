import type { Config } from "@netlify/functions";
import { requireAdmin } from "./_lib/auth.mts";
import { database } from "./_lib/db.mts";
import { body, cleanText, fail, json } from "./_lib/http.mts";

function mapBooking(row: Record<string, unknown>) {
  return { id: String(row.id), confirmationCode: String(row.confirmation_code), customerName: `${row.first_name} ${row.last_name}`,
    customerEmail: String(row.email), customerPhone: String(row.phone), serviceName: String(row.service_name), bookingDate: String(row.booking_date).slice(0, 10),
    startTime: String(row.start_time).slice(0, 5), endTime: String(row.end_time).slice(0, 5), status: String(row.status), paymentStatus: String(row.payment_status),
    totalCents: row.total_cents == null ? null : Number(row.total_cents), createdAt: new Date(String(row.created_at)).toISOString(), notes: String(row.access_notes || "") };
}

export default async (request: Request) => {
  const auth = requireAdmin(request); if ("response" in auth) return auth.response;
  const db = database();
  try {
    if (request.method === "GET") {
      const result = await db.pool.query(
        `SELECT b.*, c.first_name, c.last_name, c.email, c.phone, s.name service_name FROM bookings b
         JOIN customers c ON c.id=b.customer_id JOIN services s ON s.id=b.service_id ORDER BY b.booking_date DESC, b.start_time DESC LIMIT 1000`,
      );
      return json({ bookings: result.rows.map(mapBooking) });
    }
    if (request.method !== "PATCH") return fail("Method not allowed.", 405);
    const input = await body<{ id?: unknown; status?: unknown }>(request);
    const id = cleanText(input.id, 50); const status = cleanText(input.status, 20);
    if (!id || !["pending", "confirmed", "completed", "cancelled", "no_show"].includes(status)) return fail("Choose a valid booking status.");
    const result = await db.pool.query("UPDATE bookings SET status=$1, updated_at=now() WHERE id=$2 RETURNING id", [status, id]);
    if (!result.rows[0]) return fail("Booking not found.", 404);
    if (status === "cancelled" || status === "no_show") await db.pool.query("DELETE FROM booking_slots WHERE booking_id=$1", [id]);
    if (status === "pending" || status === "confirmed") {
      await db.pool.query(
        `INSERT INTO booking_slots (booking_date, slot_time, booking_id)
         SELECT b.booking_date, slot::time, b.id FROM bookings b,
           admin_settings settings,
           generate_series(
             b.booking_date + b.start_time,
             b.booking_date + b.end_time + settings.buffer_minutes * interval '1 minute' - interval '1 minute',
             settings.slot_interval_minutes * interval '1 minute'
           ) slot
         WHERE b.id=$1 AND settings.id=1 ON CONFLICT DO NOTHING`, [id],
      );
    }
    return json({ updated: true });
  } catch (error) { console.error("admin-bookings", error); return fail("Unable to load or update bookings.", 503); }
};

export const config: Config = { path: "/api/admin-bookings" };
