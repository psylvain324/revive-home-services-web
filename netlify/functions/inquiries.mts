import type { Config } from "@netlify/functions";
import { database, upsertCustomer } from "./_lib/db.mts";
import { body, cleanText, fail, json } from "./_lib/http.mts";

type InquiryInput = { firstName?: unknown; lastName?: unknown; email?: unknown; phone?: unknown; service?: unknown; message?: unknown; consent?: unknown; attribution?: unknown };

export default async (request: Request) => {
  if (request.method !== "POST") return fail("Method not allowed.", 405);
  try {
    const input = await body<InquiryInput>(request);
    const firstName = cleanText(input.firstName, 80);
    const lastName = cleanText(input.lastName, 80);
    const email = cleanText(input.email, 180).toLowerCase();
    const phone = cleanText(input.phone, 40);
    const service = cleanText(input.service, 80);
    const message = cleanText(input.message, 3000);
    if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email) || !phone || !service || !message || !input.consent) return fail("Please complete every required field and accept contact permission.");
    const attribution = typeof input.attribution === "object" && input.attribution ? input.attribution : {};
    const db = database();
    const customerId = await upsertCustomer(db.pool, { firstName, lastName, email, phone });
    await db.pool.query(
      "INSERT INTO inquiries (customer_id, first_name, last_name, email, phone, service, message, attribution) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)",
      [customerId, firstName, lastName, email, phone, service, message, JSON.stringify(attribution)],
    );
    return json({ message: "Thanks—your inquiry is in Revive’s queue. The team will follow up using the contact details you provided." }, 201);
  } catch (error) {
    console.error("inquiries", error);
    return fail("We could not save your inquiry. Please call (480) 582-5615.", 503);
  }
};

export const config: Config = { path: "/api/inquiries" };
