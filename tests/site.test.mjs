import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("production build emits the complete customer-facing site", async () => {
  await Promise.all([
    "dist/index.html", "dist/privacy.html", "dist/terms.html", "dist/accessibility.html",
    "dist/images/revive-co-logo.webp", "dist/images/revive-co-hero.jpg", "dist/images/og-revive-co.png",
    "dist/robots.txt", "dist/sitemap.xml",
  ].map((path) => access(new URL(`../${path}`, import.meta.url))));
});

test("metadata uses the correct Revive Co identity and production domain", async () => {
  const html = await read("dist/index.html");
  assert.match(html, /<title>Revive Co \| Residential &amp; Commercial Cleaning<\/title>/);
  assert.match(html, /https:\/\/www\.revivecoservices\.com\//);
  assert.match(html, /images\/og-revive-co\.png/);
  assert.doesNotMatch(html, /Twin Cities|revivecleanmn/i);
});

test("public experience includes booking, inquiry, payments, and Sales Vision attribution", async () => {
  const [app, booking, chrome, tracking] = await Promise.all([read("src/App.tsx"), read("src/BookingPage.tsx"), read("src/SiteChrome.tsx"), read("src/salesVision.ts")]);
  assert.match(app, /Residential cleaning/);
  assert.match(app, /Commercial cleaning/);
  assert.match(app, /\/api\/inquiries/);
  assert.match(booking, /\/api\/availability/);
  assert.match(booking, /\/api\/bookings/);
  assert.match(booking, /Apple Pay or Google Pay/);
  assert.match(chrome, /Sales Vision Consulting/);
  assert.match(chrome, /data-salesvision-site="revive-co"/);
  assert.match(tracking, /salesvision_/);
  assert.doesNotMatch(tracking, /accessNotes|address1|firstName|email/);
});

test("admin covers operations, settings, customers, expenses, tax planning, and analytics", async () => {
  const admin = await read("src/AdminPage.tsx");
  for (const phrase of ["Overview", "Bookings", "Inquiries", "Availability & pricing", "Customers", "Expenses & taxes", "Analytics", "Estimated tax reserve"]) assert.ok(admin.includes(phrase), `missing ${phrase}`);
  assert.match(admin, /\/api\/admin-login/);
  assert.match(admin, /Stripe Tax/);
});

test("backend has every platform endpoint and a transactional migration", async () => {
  const functions = await readdir(new URL("../netlify/functions", import.meta.url));
  for (const name of ["public-config.mts", "availability.mts", "bookings.mts", "inquiries.mts", "stripe-webhook.mts", "payment-status.mts", "admin-login.mts", "admin-settings.mts", "admin-dashboard.mts", "admin-bookings.mts", "admin-inquiries.mts", "admin-customers.mts", "admin-expenses.mts", "admin-analytics.mts"]) assert.ok(functions.includes(name), `missing ${name}`);
  const migration = await read("netlify/migrations/0001_revive_platform/migration.sql");
  for (const table of ["admin_settings", "business_hours", "blocked_times", "services", "customers", "bookings", "booking_slots", "inquiries", "expenses", "analytics_events"]) assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  assert.match(migration, /PRIMARY KEY \(booking_date, slot_time\)/);
  assert.match(migration, /base_price_cents[\s\S]*NULL/);
});

test("Stripe is server-calculated, webhook-verified, and fail-closed", async () => {
  const [bookings, webhook, settings] = await Promise.all([read("netlify/functions/bookings.mts"), read("netlify/functions/stripe-webhook.mts"), read("netlify/functions/_lib/db.mts")]);
  assert.match(bookings, /stripe\.checkout\.sessions\.create/);
  assert.match(bookings, /subtotalCents = availability\.service\.basePriceCents/);
  assert.match(webhook, /constructEvent\(await request\.text\(\), signature, webhookSecret\)/);
  assert.match(settings, /paymentEnabled: Boolean\(row\.payment_enabled\) && Boolean\(process\.env\.STRIPE_SECRET_KEY\)/);
});

test("Netlify configuration enables functions, security headers, and SPA routes", async () => {
  const config = await read("netlify.toml");
  assert.match(config, /command = "npm run build"/);
  assert.match(config, /publish = "dist"/);
  assert.match(config, /directory = "netlify\/functions"/);
  assert.match(config, /Content-Security-Policy/);
  assert.match(config, /from = "\/\*"/);
});
