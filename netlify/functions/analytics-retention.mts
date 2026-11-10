import type { Config } from "@netlify/functions";
import { database } from "./_lib/db.mts";

export default async () => {
  const result = await database().pool.query(
    "DELETE FROM analytics_events WHERE occurred_at < now() - interval '400 days'",
  );
  console.log("analytics-retention", { deleted: result.rowCount ?? 0 });
};

export const config: Config = {
  schedule: "@weekly",
};
