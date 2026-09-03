import type { Config } from "@netlify/functions";
import { requireAdmin } from "./_lib/auth.mts";
import { database } from "./_lib/db.mts";
import { fail, json } from "./_lib/http.mts";

export default async (request: Request) => {
  const auth = requireAdmin(request); if ("response" in auth) return auth.response;
  if (request.method !== "GET") return fail("Method not allowed.", 405);
  try {
    const result = await database().pool.query(
      `SELECT c.*, COUNT(b.id) total_bookings, COALESCE(SUM(b.amount_paid_cents),0) lifetime_value, MAX(b.booking_date) last_booking_date
       FROM customers c LEFT JOIN bookings b ON b.customer_id=c.id GROUP BY c.id ORDER BY c.created_at DESC LIMIT 2000`,
    );
    return json({ customers: result.rows.map((row: Record<string, unknown>) => ({ id: String(row.id), name: `${row.first_name} ${row.last_name}`, email: String(row.email), phone: String(row.phone),
      totalBookings: Number(row.total_bookings), lifetimeValueCents: Number(row.lifetime_value), lastBookingDate: row.last_booking_date ? String(row.last_booking_date).slice(0, 10) : null, createdAt: new Date(String(row.created_at)).toISOString() })) });
  } catch (error) { console.error("admin-customers", error); return fail("Unable to load customers.", 503); }
};

export const config: Config = { path: "/api/admin-customers" };
