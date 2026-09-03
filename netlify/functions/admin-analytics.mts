import type { Config } from "@netlify/functions";
import { requireAdmin } from "./_lib/auth.mts";
import { database } from "./_lib/db.mts";
import { fail, json, safeNumber } from "./_lib/http.mts";

export default async (request: Request) => {
  const auth = requireAdmin(request); if ("response" in auth) return auth.response;
  if (request.method !== "GET") return fail("Method not allowed.", 405);
  const range = Math.round(safeNumber(new URL(request.url).searchParams.get("range"), 7, 365, 30));
  try {
    const db = database();
    const [totals, channels, pages] = await Promise.all([
      db.pool.query(`SELECT COUNT(*) FILTER (WHERE event_name='page_view') page_views, COUNT(*) FILTER (WHERE event_name='booking_step' AND action='step_1') booking_starts,
        COUNT(*) FILTER (WHERE event_name='inquiry_submitted') inquiries, COUNT(*) FILTER (WHERE event_name='purchase') completed_bookings
        FROM analytics_events WHERE occurred_at >= now()-($1 || ' days')::interval`, [range]),
      db.pool.query(`WITH traffic AS (SELECT source, COUNT(DISTINCT anonymous_id) sessions FROM analytics_events WHERE occurred_at >= now()-($1 || ' days')::interval GROUP BY source),
        sales AS (SELECT COALESCE(attribution->>'source','direct') source, COUNT(*) bookings, COALESCE(SUM(amount_paid_cents),0) revenue FROM bookings WHERE created_at >= now()-($1 || ' days')::interval GROUP BY 1)
        SELECT COALESCE(t.source,s.source,'direct') source, COALESCE(t.sessions,0) sessions, COALESCE(s.bookings,0) bookings, COALESCE(s.revenue,0) revenue FROM traffic t FULL JOIN sales s ON s.source=t.source ORDER BY sessions DESC`, [range]),
      db.pool.query(`SELECT path, COUNT(*) views FROM analytics_events WHERE event_name='page_view' AND occurred_at >= now()-($1 || ' days')::interval GROUP BY path ORDER BY views DESC LIMIT 12`, [range]),
    ]);
    const row = totals.rows[0];
    return json({ totals: { pageViews: Number(row.page_views), bookingStarts: Number(row.booking_starts), inquiries: Number(row.inquiries), completedBookings: Number(row.completed_bookings) },
      channels: channels.rows.map((item: Record<string, unknown>) => ({ source: String(item.source), sessions: Number(item.sessions), bookings: Number(item.bookings), revenueCents: Number(item.revenue) })),
      topPages: pages.rows.map((item: Record<string, unknown>) => ({ path: String(item.path), views: Number(item.views) })) });
  } catch (error) { console.error("admin-analytics", error); return fail("Unable to load analytics.", 503); }
};

export const config: Config = { path: "/api/admin-analytics" };
