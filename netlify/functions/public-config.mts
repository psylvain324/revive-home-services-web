import type { Config } from "@netlify/functions";
import { settingsBundle } from "./_lib/db.mts";
import { fail, json } from "./_lib/http.mts";

export default async (request: Request) => {
  if (request.method !== "GET") return fail("Method not allowed.", 405);
  try {
    const config = await settingsBundle();
    return json({
      timezone: config.timezone,
      leadTimeHours: config.leadTimeHours,
      slotIntervalMinutes: config.slotIntervalMinutes,
      bufferMinutes: config.bufferMinutes,
      paymentEnabled: config.paymentEnabled,
      taxEnabled: config.taxEnabled,
      depositPercent: config.depositPercent,
      hours: config.hours,
      services: config.services,
      addOns: config.addOns,
    });
  } catch (error) {
    console.error("public-config", error);
    return fail("Online scheduling is being configured. Please call Revive Co.", 503);
  }
};

export const config: Config = { path: "/api/public-config" };
