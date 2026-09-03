import type { Config } from "@netlify/functions";
import { requireAdmin } from "./_lib/auth.mts";
import { database } from "./_lib/db.mts";
import { body, cleanText, fail, json } from "./_lib/http.mts";

export default async (request: Request) => {
  const auth = requireAdmin(request); if ("response" in auth) return auth.response;
  const db = database();
  try {
    if (request.method === "GET") {
      const result = await db.pool.query("SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 2000");
      return json({ inquiries: result.rows.map((row: Record<string, unknown>) => ({ id: String(row.id), customerName: `${row.first_name} ${row.last_name}`, email: String(row.email), phone: String(row.phone), service: String(row.service), message: String(row.message), status: String(row.status), createdAt: new Date(String(row.created_at)).toISOString() })) });
    }
    if (request.method !== "PATCH") return fail("Method not allowed.", 405);
    const input = await body<{ id?: unknown; status?: unknown }>(request);
    const id = cleanText(input.id, 50); const status = cleanText(input.status, 20);
    if (!id || !["new", "contacted", "quoted", "won", "closed"].includes(status)) return fail("Choose a valid inquiry status.");
    const result = await db.pool.query("UPDATE inquiries SET status=$1 WHERE id=$2 RETURNING id", [status, id]);
    if (!result.rows[0]) return fail("Inquiry not found.", 404);
    return json({ updated: true });
  } catch (error) { console.error("admin-inquiries", error); return fail("Unable to load or update inquiries.", 503); }
};

export const config: Config = { path: "/api/admin-inquiries" };
