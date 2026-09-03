import type { Config } from "@netlify/functions";
import { database } from "./_lib/db.mts";
import { body, cleanText, clientIp, json } from "./_lib/http.mts";

type TrackInput = Record<string, unknown> & { attribution?: Record<string, unknown> };
const recent = new Map<string, { count: number; reset: number }>();

export default async (request: Request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  const ip = clientIp(request);
  const now = Date.now();
  const rate = recent.get(ip) || { count: 0, reset: now + 60_000 };
  if (rate.reset < now) { rate.count = 0; rate.reset = now + 60_000; }
  rate.count += 1; recent.set(ip, rate);
  if (rate.count > 60) return json({ accepted: false }, 429);
  try {
    const input = await body<TrackInput>(request);
    const attribution = input.attribution || {};
    const db = database();
    await db.pool.query(
      `INSERT INTO analytics_events (event_name, action, category, label, value, path, anonymous_id, source, medium, campaign, landing_page, referrer)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [cleanText(input.event, 80), cleanText(input.action, 100) || null, cleanText(input.category, 80) || null, cleanText(input.label, 160) || null,
        Number.isFinite(Number(input.value)) ? Number(input.value) : null, cleanText(input.path, 300), cleanText(input.anonymousId, 100),
        cleanText(attribution.source, 120) || "direct", cleanText(attribution.medium, 120) || "none", cleanText(attribution.campaign, 160) || "none",
        cleanText(attribution.landingPage, 500) || null, cleanText(attribution.referrer, 500) || null],
    );
    return json({ accepted: true }, 202);
  } catch (error) {
    console.error("track", error);
    return json({ accepted: false }, 202);
  }
};

export const config: Config = { path: "/api/track" };
