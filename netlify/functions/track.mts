import type { Config } from "@netlify/functions";
import { database } from "./_lib/db.mts";
import { body, cleanText, json } from "./_lib/http.mts";

type TrackInput = Record<string, unknown> & { attribution?: Record<string, unknown> };
const allowedEvents = new Set(["conversion_click", "page_view"]);
const allowedActions = new Set(["book-service", "contact-form", "phone"]);

export default async (request: Request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  if (Number(request.headers.get("content-length") || 0) > 16_384) return json({ accepted: false }, 413);
  try {
    const input = await body<TrackInput>(request);
    const event = cleanText(input.event, 80);
    const action = cleanText(input.action, 100);
    const anonymousId = cleanText(input.anonymousId, 100);
    if (!allowedEvents.has(event) || (event === "conversion_click" && !allowedActions.has(action)) || !/^[a-zA-Z0-9-]{8,100}$/.test(anonymousId)) {
      return json({ accepted: false }, 202);
    }
    const attribution = input.attribution || {};
    const db = database();
    await db.pool.query(
      `INSERT INTO analytics_events (event_name, action, category, label, value, path, anonymous_id, source, medium, campaign, landing_page, referrer)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [event, action || null, cleanText(input.category, 80) || null, cleanText(input.label, 160) || null,
        Number.isFinite(Number(input.value)) ? Number(input.value) : null, cleanText(input.path, 300), anonymousId,
        cleanText(attribution.source, 120) || "direct", cleanText(attribution.medium, 120) || "none", cleanText(attribution.campaign, 160) || "none",
        cleanText(attribution.landingPage, 500) || null, cleanText(attribution.referrer, 500) || null],
    );
    return json({ accepted: true }, 202);
  } catch (error) {
    console.error("track", error);
    return json({ accepted: false }, 202);
  }
};

export const config: Config = {
  path: "/api/track",
  method: "POST",
  rateLimit: { aggregateBy: ["ip"], windowLimit: 30, windowSize: 60 },
};
