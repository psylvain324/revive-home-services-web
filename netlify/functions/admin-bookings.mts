import type { Config } from "@netlify/functions";
import { requireAdmin } from "./_lib/auth.mts";
import { database } from "./_lib/db.mts";
import { fail, json } from "./_lib/http.mts";

function mapBooking(row: Record<string, unknown>) {
  return { id: String(row.id), confirmationCode: String(row.confirmation_code), customerName: `${row.first_name} ${row.last_name}`,
    customerEmail: String(row.email), customerPhone: String(row.phone), serviceName: String(row.service_name), bookingDate: String(row.booking_date).slice(0, 10),
    startTime: String(row.start_time).slice(0, 5), endTime: String(row.end_time).slice(0, 5), status: String(row.status), paymentStatus: String(row.payment_status),
    totalCents: row.total_cents == null ? null : Number(row.total_cents), createdAt: new Date(String(row.created_at)).toISOString(), notes: String(row.access_notes || "") };
}

export default async (request: Request) => {
  const auth = requireAdmin(request); if ("response" in auth) return auth.response;
  if (request.method !== "GET") return fail("Historical booking records are read-only.", 405);
  const db = database();
  try {
    const result = await db.pool.query(
      `SELECT b.*, c.first_name, c.last_name, c.email, c.phone, s.name service_name FROM bookings b
       JOIN customers c ON c.id=b.customer_id JOIN services s ON s.id=b.service_id ORDER BY b.booking_date DESC, b.start_time DESC LIMIT 1000`,
    );
    return json({ bookings: result.rows.map(mapBooking) });
  } catch (error) { console.error("admin-bookings", error); return fail("Unable to load historical bookings.", 503); }
};

export const config: Config = { path: "/api/admin-bookings" };
