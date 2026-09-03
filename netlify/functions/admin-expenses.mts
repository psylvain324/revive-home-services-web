import type { Config } from "@netlify/functions";
import { requireAdmin } from "./_lib/auth.mts";
import { database } from "./_lib/db.mts";
import { body, cleanText, fail, json, safeNumber, validDate } from "./_lib/http.mts";

function mapExpense(row: Record<string, unknown>) {
  return { id: String(row.id), expenseDate: String(row.expense_date).slice(0, 10), vendor: String(row.vendor), category: String(row.category),
    description: String(row.description), amountCents: Number(row.amount_cents), taxDeductible: Boolean(row.tax_deductible), createdAt: new Date(String(row.created_at)).toISOString() };
}

export default async (request: Request) => {
  const auth = requireAdmin(request); if ("response" in auth) return auth.response;
  const db = database();
  try {
    if (request.method === "GET") {
      const range = Math.round(safeNumber(new URL(request.url).searchParams.get("range"), 7, 3650, 30));
      const result = await db.pool.query("SELECT * FROM expenses WHERE expense_date >= CURRENT_DATE-($1::int-1) ORDER BY expense_date DESC, created_at DESC LIMIT 2000", [range]);
      return json({ expenses: result.rows.map(mapExpense) });
    }
    const input = await body<Record<string, unknown>>(request);
    if (request.method === "DELETE") {
      const id = cleanText(input.id, 50); if (!id) return fail("Choose an expense to remove.");
      await db.pool.query("DELETE FROM expenses WHERE id=$1", [id]); return json({ deleted: true });
    }
    if (request.method !== "POST") return fail("Method not allowed.", 405);
    const date = cleanText(input.expenseDate, 10); const vendor = cleanText(input.vendor, 160); const category = cleanText(input.category, 100); const description = cleanText(input.description, 500);
    const amountCents = Math.round(safeNumber(input.amount, .01, 10_000_000, 0) * 100);
    if (!validDate(date) || !vendor || !category || amountCents <= 0) return fail("Enter a valid date, vendor, category, and amount.");
    const result = await db.pool.query("INSERT INTO expenses (expense_date,vendor,category,description,amount_cents,tax_deductible) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *", [date, vendor, category, description, amountCents, Boolean(input.taxDeductible)]);
    return json(mapExpense(result.rows[0]), 201);
  } catch (error) { console.error("admin-expenses", error); return fail("Unable to update expenses.", 503); }
};

export const config: Config = { path: "/api/admin-expenses" };
