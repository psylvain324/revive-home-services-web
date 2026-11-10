import type { Config } from "@netlify/functions";
import { requireAdmin } from "./_lib/auth.mts";
import { database } from "./_lib/db.mts";
import { fail, json } from "./_lib/http.mts";

export default async (request: Request) => {
  const auth = requireAdmin(request); if ("response" in auth) return auth.response;
  if (request.method !== "GET") return fail("Historical inquiry records are read-only.", 405);
  const db = database();
  try {
    const result = await db.pool.query("SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 2000");
    return json({ inquiries: result.rows.map((row: Record<string, unknown>) => ({ id: String(row.id), customerName: `${row.first_name} ${row.last_name}`, email: String(row.email), phone: String(row.phone), service: String(row.service), message: String(row.message), status: String(row.status), createdAt: new Date(String(row.created_at)).toISOString() })) });
  } catch (error) { console.error("admin-inquiries", error); return fail("Unable to load historical inquiries.", 503); }
};

export const config: Config = { path: "/api/admin-inquiries" };
