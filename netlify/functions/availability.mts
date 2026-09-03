import type { Config } from "@netlify/functions";
import { availableSlots } from "./_lib/db.mts";
import { fail, json, validDate } from "./_lib/http.mts";

export default async (request: Request) => {
  if (request.method !== "GET") return fail("Method not allowed.", 405);
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || "";
  const service = url.searchParams.get("service") || "";
  const addOns = (url.searchParams.get("addons") || "").split(",").filter(Boolean).slice(0, 20);
  if (!validDate(date) || !service) return fail("Choose a valid date and service.");
  try {
    const result = await availableSlots(date, service, addOns);
    return json({ date, timezone: result.config.timezone, durationMinutes: result.duration, slots: result.slots });
  } catch (error) {
    console.error("availability", error);
    return fail(error instanceof Error ? error.message : "Could not load availability.", 503);
  }
};

export const config: Config = { path: "/api/availability" };
