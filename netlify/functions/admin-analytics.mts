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
      db.pool.query(`SELECT COUNT(*) FILTER (WHERE event_name='page_view') page_views,
        COUNT(*) FILTER (WHERE event_name='conversion_click' AND action='book-service') booking_clicks,
        COUNT(*) FILTER (WHERE event_name='conversion_click' AND action='contact-form') contact_clicks,
        COUNT(*) FILTER (WHERE event_name='conversion_click' AND action='phone') phone_clicks
        FROM analytics_events WHERE occurred_at >= now()-($1 || ' days')::interval`, [range]),
      db.pool.query(`SELECT source, COUNT(DISTINCT anonymous_id) sessions,
        COUNT(*) FILTER (WHERE event_name='conversion_click' AND action='book-service') booking_clicks
        FROM analytics_events WHERE occurred_at >= now()-($1 || ' days')::interval
        GROUP BY source ORDER BY sessions DESC`, [range]),
      db.pool.query(`SELECT path, COUNT(*) views FROM analytics_events WHERE event_name='page_view' AND occurred_at >= now()-($1 || ' days')::interval GROUP BY path ORDER BY views DESC LIMIT 12`, [range]),
    ]);
    const row = totals.rows[0];
    return json({ totals: { pageViews: Number(row.page_views), bookingClicks: Number(row.booking_clicks), contactClicks: Number(row.contact_clicks), phoneClicks: Number(row.phone_clicks) },
      channels: channels.rows.map((item: Record<string, unknown>) => ({ source: String(item.source), sessions: Number(item.sessions), bookingClicks: Number(item.booking_clicks) })),
      topPages: pages.rows.map((item: Record<string, unknown>) => ({ path: String(item.path), views: Number(item.views) })) });
  } catch (error) { console.error("admin-analytics", error); return fail("Unable to load analytics.", 503); }
};

export const config: Config = { path: "/api/admin-analytics" };
