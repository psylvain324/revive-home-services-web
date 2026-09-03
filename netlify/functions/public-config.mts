import type { Config } from "@netlify/functions";
import { settingsBundle } from "./_lib/db.mts";
import { fail, json } from "./_lib/http.mts";

export default async (request: Request) => {
  if (request.method !== "GET") return fail("Method not allowed.", 405);
  try {
    const { estimatedTaxRate: _privateRate, blockedTimes: _privateBlocks, businessName: _privateName, businessPhone: _privatePhone, currency: _privateCurrency, ...publicConfig } = await settingsBundle();
    return json(publicConfig);
  } catch (error) {
    console.error("public-config", error);
    return fail("Online scheduling is being configured. Please call Revive Co.", 503);
  }
};

export const config: Config = { path: "/api/public-config" };
