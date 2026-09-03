import type { Config } from "@netlify/functions";
import { requireAdmin } from "./_lib/auth.mts";
import { database } from "./_lib/db.mts";
import { fail, json, safeNumber } from "./_lib/http.mts";

function mapBooking(row: Record<string, unknown>) {
  return { id: String(row.id), confirmationCode: String(row.confirmation_code), customerName: `${row.first_name} ${row.last_name}`,
    customerEmail: String(row.email), customerPhone: String(row.phone), serviceName: String(row.service_name), bookingDate: String(row.booking_date).slice(0, 10),
    startTime: String(row.start_time).slice(0, 5), endTime: String(row.end_time).slice(0, 5), status: String(row.status), paymentStatus: String(row.payment_status),
    totalCents: row.total_cents == null ? null : Number(row.total_cents), createdAt: new Date(String(row.created_at)).toISOString(), notes: String(row.access_notes || "") };
}

export default async (request: Request) => {
  const auth = requireAdmin(request); if ("response" in auth) return auth.response;
  if (request.method !== "GET") return fail("Method not allowed.", 405);
  const range = Math.round(safeNumber(new URL(request.url).searchParams.get("range"), 7, 365, 30));
  try {
    const db = database();
    const [money, counts, revenueDays, byService, recent, sessions, settings] = await Promise.all([
      db.pool.query(`SELECT COALESCE(SUM(amount_paid_cents),0) revenue, COALESCE(SUM(GREATEST(COALESCE(total_cents,0)-amount_paid_cents,0)),0) outstanding FROM bookings WHERE created_at >= now() - ($1 || ' days')::interval AND status <> 'cancelled'`, [range]),
      db.pool.query(`SELECT COUNT(*) FILTER (WHERE booking_date >= CURRENT_DATE AND status IN ('pending','confirmed')) bookings, COUNT(DISTINCT customer_id) customers FROM bookings WHERE created_at >= now() - ($1 || ' days')::interval`, [range]),
      db.pool.query(`SELECT d::date day, COALESCE(SUM(b.amount_paid_cents),0) revenue, COUNT(b.id) bookings FROM generate_series(CURRENT_DATE-($1::int-1),CURRENT_DATE,'1 day') d LEFT JOIN bookings b ON b.updated_at::date=d::date AND b.payment_status='paid' GROUP BY d ORDER BY d`, [range]),
      db.pool.query(`SELECT s.name, COUNT(b.id) count, COALESCE(SUM(b.amount_paid_cents),0) revenue FROM services s LEFT JOIN bookings b ON b.service_id=s.id AND b.created_at >= now()-($1 || ' days')::interval AND b.status <> 'cancelled' GROUP BY s.id,s.name ORDER BY count DESC,s.sort_order`, [range]),
      db.pool.query(`SELECT b.*,c.first_name,c.last_name,c.email,c.phone,s.name service_name FROM bookings b JOIN customers c ON c.id=b.customer_id JOIN services s ON s.id=b.service_id ORDER BY b.created_at DESC LIMIT 8`),
      db.pool.query(`SELECT COUNT(DISTINCT anonymous_id) sessions FROM analytics_events WHERE occurred_at >= now()-($1 || ' days')::interval`, [range]),
      db.pool.query(`SELECT estimated_tax_rate FROM admin_settings WHERE id=1`),
    ]);
    const expenses = await db.pool.query(`SELECT COALESCE(SUM(amount_cents),0) total FROM expenses WHERE expense_date >= CURRENT_DATE-($1::int-1)`, [range]);
    const gross = Number(money.rows[0].revenue); const expense = Number(expenses.rows[0].total); const net = gross - expense;
    const bookings = Number(counts.rows[0].bookings); const uniqueSessions = Number(sessions.rows[0].sessions);
    const taxRate = Number(settings.rows[0]?.estimated_tax_rate || 0);
    return json({
      summary: { grossRevenueCents: gross, outstandingCents: Number(money.rows[0].outstanding), expenseCents: expense, netCents: net,
        estimatedTaxCents: Math.max(0, Math.round(net * taxRate / 100)), bookings, customers: Number(counts.rows[0].customers), conversionRate: uniqueSessions ? bookings / uniqueSessions * 100 : 0 },
      revenueByDay: revenueDays.rows.map((row: Record<string, unknown>) => ({ day: String(row.day).slice(0, 10), revenueCents: Number(row.revenue), bookings: Number(row.bookings) })),
      bookingsByService: byService.rows.map((row: Record<string, unknown>) => ({ name: String(row.name), count: Number(row.count), revenueCents: Number(row.revenue) })),
      recentBookings: recent.rows.map(mapBooking), rangeDays: range,
    });
  } catch (error) { console.error("admin-dashboard", error); return fail("Unable to load dashboard metrics.", 503); }
};

export const config: Config = { path: "/api/admin-dashboard" };
