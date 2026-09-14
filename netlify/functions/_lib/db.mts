import { getDatabase } from "@netlify/database";

export function database() {
  return getDatabase();
}

export function timeToMinutes(time: string) {
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  return hour * 60 + minute;
}

export function minutesToTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function displayTime(value: string) {
  const [hour, minute] = value.slice(0, 5).split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

type SettingsRow = Record<string, unknown>;

function toService(row: SettingsRow) {
  return {
    id: String(row.id), name: String(row.name), shortDescription: String(row.short_description),
    description: String(row.description), basePriceCents: row.base_price_cents == null ? null : Number(row.base_price_cents),
    durationMinutes: Number(row.duration_minutes), active: Boolean(row.active), sortOrder: Number(row.sort_order),
  };
}

function toAddOn(row: SettingsRow) {
  return { id: String(row.id), name: String(row.name), priceCents: Number(row.price_cents), durationMinutes: Number(row.duration_minutes), active: Boolean(row.active) };
}

export async function settingsBundle() {
  const db = database();
  const [settings, hours, services, addOns, blocks] = await Promise.all([
    db.pool.query("SELECT * FROM admin_settings WHERE id = 1"),
    db.pool.query("SELECT * FROM business_hours ORDER BY weekday"),
    db.pool.query("SELECT * FROM services ORDER BY sort_order, name"),
    db.pool.query("SELECT * FROM add_ons ORDER BY sort_order, name"),
    db.pool.query(`SELECT id, to_char(starts_at, 'YYYY-MM-DD"T"HH24:MI') starts_at, to_char(ends_at, 'YYYY-MM-DD"T"HH24:MI') ends_at, reason FROM blocked_times WHERE ends_at >= CURRENT_DATE ORDER BY starts_at LIMIT 250`),
  ]);
  if (!settings.rows[0]) throw new Error("The platform database has not been initialized.");
  const row = settings.rows[0] as SettingsRow;
  return {
    businessName: String(row.business_name), businessPhone: String(row.business_phone), timezone: String(row.timezone),
    currency: String(row.currency), leadTimeHours: Number(row.lead_time_hours), slotIntervalMinutes: Number(row.slot_interval_minutes),
    bufferMinutes: Number(row.buffer_minutes), paymentEnabled: Boolean(row.payment_enabled) && Boolean(process.env.STRIPE_SECRET_KEY),
    taxEnabled: Boolean(row.tax_enabled), depositPercent: Number(row.deposit_percent), estimatedTaxRate: Number(row.estimated_tax_rate),
    hours: (hours.rows as SettingsRow[]).map((item) => ({ weekday: Number(item.weekday), enabled: Boolean(item.enabled), openTime: String(item.open_time).slice(0, 5), closeTime: String(item.close_time).slice(0, 5) })),
    services: (services.rows as SettingsRow[]).map(toService), addOns: (addOns.rows as SettingsRow[]).map(toAddOn),
    blockedTimes: (blocks.rows as SettingsRow[]).map((item) => ({ id: String(item.id), startsAt: String(item.starts_at).replace(" ", "T").slice(0, 16), endsAt: String(item.ends_at).replace(" ", "T").slice(0, 16), reason: String(item.reason) })),
  };
}

export async function upsertCustomer(client: { query: (text: string, values?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }> }, input: { firstName: string; lastName: string; email: string; phone: string; marketingConsent?: boolean }) {
  const result = await client.query(
    `INSERT INTO customers (first_name, last_name, email, phone, marketing_consent)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (lower(email)) DO UPDATE SET first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name, phone=EXCLUDED.phone,
       marketing_consent=customers.marketing_consent OR EXCLUDED.marketing_consent, updated_at=now()
     RETURNING id`,
    [input.firstName, input.lastName, input.email.toLowerCase(), input.phone, Boolean(input.marketingConsent)],
  );
  return String(result.rows[0].id);
}

export function localNow(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date()).reduce<Record<string, string>>((all, part) => ({ ...all, [part.type]: part.value }), {});
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export async function availableSlots(date: string, serviceId: string, addOnIds: string[]) {
  const config = await settingsBundle();
  const service = config.services.find((item) => item.id === serviceId && item.active);
  if (!service) throw new Error("Please choose an available service.");
  const validAddOns = config.addOns.filter((item) => item.active && addOnIds.includes(item.id));
  const duration = service.durationMinutes + validAddOns.reduce((sum, item) => sum + item.durationMinutes, 0);
  const requiredMinutes = Math.ceil((duration + config.bufferMinutes) / config.slotIntervalMinutes) * config.slotIntervalMinutes;
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const hours = config.hours.find((item) => item.weekday === weekday);
  if (!hours?.enabled) return { config, service, addOns: validAddOns, duration, requiredMinutes, slots: [] as Array<{ value: string; label: string; available: boolean }> };

  const db = database();
  await db.pool.query(`DELETE FROM booking_slots USING bookings WHERE booking_slots.booking_id = bookings.id AND bookings.payment_status = 'pending' AND bookings.expires_at < now()`);
  const [occupiedResult, blocksResult] = await Promise.all([
    db.pool.query("SELECT slot_time FROM booking_slots WHERE booking_date = $1", [date]),
    db.pool.query("SELECT starts_at, ends_at FROM blocked_times WHERE starts_at::date <= $1::date AND ends_at::date >= $1::date", [date]),
  ]);
  const occupied = new Set((occupiedResult.rows as SettingsRow[]).map((row) => String(row.slot_time).slice(0, 5)));
  const blocks = (blocksResult.rows as SettingsRow[]).map((row) => ({ start: String(row.starts_at).replace(" ", "T"), end: String(row.ends_at).replace(" ", "T") }));
  const now = localNow(config.timezone);
  const dayDistance = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${now.date}T00:00:00Z`)) / 86_400_000);
  const minutesFromNowAtMidnight = dayDistance * 1440 - timeToMinutes(now.time);
  const slots = [] as Array<{ value: string; label: string; available: boolean }>;
  const open = timeToMinutes(hours.openTime);
  const close = timeToMinutes(hours.closeTime);
  for (let start = open; start + requiredMinutes <= close; start += config.slotIntervalMinutes) {
    let available = minutesFromNowAtMidnight + start >= config.leadTimeHours * 60;
    for (let minute = start; minute < start + requiredMinutes; minute += config.slotIntervalMinutes) {
      if (occupied.has(minutesToTime(minute))) available = false;
    }
    const startStamp = `${date}T${minutesToTime(start)}`;
    const endStamp = `${date}T${minutesToTime(start + requiredMinutes)}`;
    if (blocks.some((block) => startStamp < block.end && endStamp > block.start)) available = false;
    slots.push({ value: minutesToTime(start), label: displayTime(minutesToTime(start)), available });
  }
  return { config, service, addOns: validAddOns, duration, requiredMinutes, slots };
}
