import type { Config } from "@netlify/functions";
import { database, upsertCustomer } from "./_lib/db.mts";
import { body, cleanText, fail, json, safeNumber } from "./_lib/http.mts";

type RequestDetailsInput = {
  addOnIds?: unknown;
  frequency?: unknown;
  propertyType?: unknown;
  bedrooms?: unknown;
  bathrooms?: unknown;
  squareFeet?: unknown;
};

type InquiryInput = {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  phone?: unknown;
  service?: unknown;
  message?: unknown;
  consent?: unknown;
  requestDetails?: RequestDetailsInput;
  attribution?: unknown;
};

const titleize = (value: string) => value
  .replaceAll("-", " ")
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const serviceLabels: Record<string, string> = {
  "standard-cleaning": "Residential Cleaning",
  "deep-cleaning": "Deep Cleaning",
  "move-cleaning": "Move-In / Move-Out",
  "commercial-cleaning": "Commercial Cleaning",
  "post-construction-cleaning": "Post-Construction",
};

const addOnLabels: Record<string, string> = {
  "inside-oven": "Inside Oven",
  "inside-refrigerator": "Inside Refrigerator",
  "interior-windows": "Interior Windows",
  "laundry-linens": "Laundry / Linen Change",
};

const frequencyLabels: Record<string, string> = {
  "one-time": "One-time",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  custom: "Custom",
};

const propertyLabels: Record<string, string> = {
  house: "House",
  apartment: "Apartment / Condo",
  office: "Office / Commercial",
  rental: "Rental / Short-Term Rental",
  other: "Other",
};

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

async function sendNotification(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  detailLines: string[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
  if (!apiKey || !from || !to) throw new Error("Contact email delivery is not configured.");

  const serviceName = serviceLabels[input.service] || titleize(input.service);
  const detailText = input.detailLines.length ? `\n\nRequest details\n${input.detailLines.join("\n")}` : "";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: input.email,
      subject: `New ${serviceName} request from ${input.firstName} ${input.lastName}`,
      text: [
        "A new service request was submitted on the Revive Co website.",
        "",
        `Name: ${input.firstName} ${input.lastName}`,
        `Email: ${input.email}`,
        `Phone: ${input.phone}`,
        `Service: ${serviceName}`,
        detailText,
        "",
        "Customer message",
        input.message,
      ].join("\n"),
      html: `
        <h1>New service request</h1>
        <p>A customer submitted a request on the Revive Co website. Reply to this email to contact them.</p>
        <table cellpadding="8" cellspacing="0" style="border-collapse:collapse">
          <tr><td><strong>Name</strong></td><td>${escapeHtml(`${input.firstName} ${input.lastName}`)}</td></tr>
          <tr><td><strong>Email</strong></td><td><a href="mailto:${escapeHtml(input.email)}">${escapeHtml(input.email)}</a></td></tr>
          <tr><td><strong>Phone</strong></td><td>${escapeHtml(input.phone)}</td></tr>
          <tr><td><strong>Service</strong></td><td>${escapeHtml(serviceName)}</td></tr>
          ${input.detailLines.map((line) => {
            const separator = line.indexOf(":");
            const label = separator >= 0 ? line.slice(0, separator) : "Detail";
            const value = separator >= 0 ? line.slice(separator + 1).trim() : line;
            return `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`;
          }).join("")}
        </table>
        <h2>Customer message</h2>
        <p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("inquiry notification failed", response.status, errorText.slice(0, 500));
    throw new Error("Contact email delivery failed.");
  }
}

export default async (request: Request) => {
  if (request.method !== "POST") return fail("Method not allowed.", 405);
  try {
    const input = await body<InquiryInput>(request);
    const firstName = cleanText(input.firstName, 80);
    const lastName = cleanText(input.lastName, 80);
    const email = cleanText(input.email, 180).toLowerCase();
    const phone = cleanText(input.phone, 40);
    const service = cleanText(input.service, 80);
    const customerMessage = cleanText(input.message, 3000);
    if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email) || !phone || !service || !customerMessage || !input.consent) {
      return fail("Please complete every required field and accept contact permission.");
    }

    const requestDetails = input.requestDetails && typeof input.requestDetails === "object" ? input.requestDetails : {};
    const addOnIds = Array.isArray(requestDetails.addOnIds)
      ? requestDetails.addOnIds.map((value) => cleanText(value, 80)).filter(Boolean).slice(0, 20)
      : [];
    const frequency = cleanText(requestDetails.frequency, 40);
    const propertyType = cleanText(requestDetails.propertyType, 80);
    const bedrooms = requestDetails.bedrooms == null ? null : safeNumber(requestDetails.bedrooms, 0, 20, 0);
    const bathrooms = requestDetails.bathrooms == null ? null : safeNumber(requestDetails.bathrooms, 0, 20, 0);
    const squareFeet = requestDetails.squareFeet == null || requestDetails.squareFeet === ""
      ? null
      : safeNumber(requestDetails.squareFeet, 100, 100000, 100);

    const detailLines = [
      frequency ? `Frequency: ${frequencyLabels[frequency] || titleize(frequency)}` : "",
      propertyType ? `Property: ${propertyLabels[propertyType] || titleize(propertyType)}` : "",
      bedrooms == null ? "" : `Bedrooms: ${bedrooms}`,
      bathrooms == null ? "" : `Bathrooms: ${bathrooms}`,
      squareFeet == null ? "" : `Approx. size: ${squareFeet.toLocaleString("en-US")} sq. ft.`,
      addOnIds.length ? `Add-on requests: ${addOnIds.map((id) => addOnLabels[id] || titleize(id)).join(", ")}` : "",
    ].filter(Boolean);
    const savedMessage = [...detailLines, "", customerMessage].join("\n");
    const attribution = typeof input.attribution === "object" && input.attribution ? input.attribution : {};

    const db = database();
    const customerId = await upsertCustomer(db.pool, { firstName, lastName, email, phone });
    await db.pool.query(
      "INSERT INTO inquiries (customer_id, first_name, last_name, email, phone, service, message, attribution) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)",
      [customerId, firstName, lastName, email, phone, service, savedMessage, JSON.stringify(attribution)],
    );
    await sendNotification({ firstName, lastName, email, phone, service, message: customerMessage, detailLines });

    return json({ message: "Your request was sent to Revive. The team will follow up using the email or phone number you provided." }, 201);
  } catch (error) {
    console.error("inquiries", error);
    return fail("We could not send your request. Please call (480) 582-5615.", 503);
  }
};

export const config: Config = { path: "/api/inquiries" };
