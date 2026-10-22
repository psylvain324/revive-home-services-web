import assert from "node:assert/strict";
import { scryptSync } from "node:crypto";
import { access, readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("production build emits the complete customer-facing site", async () => {
  await Promise.all([
    "dist/index.html", "dist/privacy.html", "dist/terms.html", "dist/accessibility.html",
    "dist/images/revive-homeservices-logo.png", "dist/images/revive-homeservices-logo-compact.png", "dist/images/favicon.png", "dist/images/phillip-sylvain.jpg", "dist/images/revive-co-hero.jpg", "dist/images/revive-co-hero-768.jpg",
    "dist/images/og-revive-co.jpg", "dist/images/construction-cleaning.jpg", "dist/images/construction-cleaning-768.jpg",
    "dist/robots.txt", "dist/sitemap.xml",
  ].map((path) => access(new URL(`../${path}`, import.meta.url))));
});

test("metadata uses the correct Revive Co identity and production domain", async () => {
  const html = await read("dist/index.html");
  assert.match(html, /<title>Revive Co \| Residential &amp; Commercial Cleaning<\/title>/);
  assert.match(html, /https:\/\/www\.revivecoservices\.com\//);
  assert.match(html, /images\/og-revive-co\.jpg/);
  assert.doesNotMatch(html, /Twin Cities|revivecleanmn/i);
});

test("public experience is request-only and retains detailed service choices", async () => {
  const [app, requestPage, inquiries, chrome, tracking] = await Promise.all([read("src/App.tsx"), read("src/BookingPage.tsx"), read("netlify/functions/inquiries.mts"), read("src/SiteChrome.tsx"), read("src/salesVision.ts")]);
  assert.match(app, /Residential Cleaning/);
  assert.match(app, /Commercial Cleaning/);
  assert.match(app, /\/api\/inquiries/);
  assert.match(app, /Choose Your Clean/);
  assert.match(app, /Scope, Pricing &amp; Availability Follow-Up/);
  assert.doesNotMatch(app, /process-section|A Simple First Step/);
  assert.match(requestPage, /Property &amp; Frequency/);
  assert.match(requestPage, /Optional Add-On Requests/);
  assert.match(requestPage, /\/api\/inquiries/);
  assert.match(requestPage, /No scheduling or payment happens online/);
  assert.doesNotMatch(requestPage, /\/api\/availability|\/api\/bookings|checkoutUrl|paymentChoice/);
  assert.match(inquiries, /https:\/\/api\.resend\.com\/emails/);
  assert.match(inquiries, /reply_to: input\.email/);
  assert.match(chrome, /Sales Vision Consulting/);
  assert.match(chrome, /Phillip Sylvain/);
  assert.match(chrome, /phillip-sylvain\.jpg/);
  assert.match(chrome, /revive-homeservices-logo-compact\.png/);
  assert.match(chrome, /header-socials/);
  assert.doesNotMatch(app, /<a className="service-image"/);
  assert.match(chrome, /data-salesvision-site="revive-co"/);
  for (const platform of ["instagram.com", "facebook.com", "linkedin.com", "google.com\/maps"]) assert.match(chrome, new RegExp(platform));
  assert.match(chrome, /noopener noreferrer/);
  assert.match(tracking, /salesvision_/);
  assert.doesNotMatch(tracking, /accessNotes|address1|firstName|email/);
});

test("admin covers operations, settings, customers, expenses, tax planning, and analytics", async () => {
  const [admin, adminLogin] = await Promise.all([read("src/AdminPage.tsx"), read("netlify/functions/admin-login.mts")]);
  for (const phrase of ["Overview", "Bookings", "Inquiries", "Availability & Pricing", "Customers", "Expenses & Taxes", "Analytics", "Estimated tax reserve"]) assert.ok(admin.includes(phrase), `missing ${phrase}`);
  assert.match(admin, /\/api\/admin-login/);
  assert.match(admin, /Stripe Tax/);
  assert.match(adminLogin, /psylvain324@gmail\.com/);
  assert.match(adminLogin, /STATIC_ADMIN_PASSWORD_HASH/);
  assert.doesNotMatch(adminLogin, /password123/);
  const staticPasswordHash = adminLogin.match(/STATIC_ADMIN_PASSWORD_HASH = "([^"]+)"/)?.[1];
  assert.ok(staticPasswordHash, "static administrator password hash is missing");
  const [, salt, expected] = staticPasswordHash.split("$");
  assert.equal(scryptSync("password123", salt, 64).toString("hex"), expected);
});

test("backend has every platform endpoint and a transactional migration", async () => {
  const functions = await readdir(new URL("../netlify/functions", import.meta.url));
  for (const name of ["public-config.mts", "availability.mts", "bookings.mts", "inquiries.mts", "stripe-webhook.mts", "payment-status.mts", "admin-login.mts", "admin-settings.mts", "admin-dashboard.mts", "admin-bookings.mts", "admin-inquiries.mts", "admin-customers.mts", "admin-expenses.mts", "admin-analytics.mts"]) assert.ok(functions.includes(name), `missing ${name}`);
  const migration = await read("netlify/database/migrations/0001_revive_platform/migration.sql");
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
  const [config, robots] = await Promise.all([read("netlify.toml"), read("public/robots.txt")]);
  assert.match(config, /command = "npm run build"/);
  assert.match(config, /publish = "dist"/);
  assert.match(config, /directory = "netlify\/functions"/);
  assert.match(config, /framework = "#custom"/);
  assert.match(config, /command = "npm run dev:netlify"/);
  assert.match(config, /Content-Security-Policy/);
  assert.match(config, /from = "\/\*"/);
  assert.match(config, /X-Robots-Tag = "noindex, nofollow"/);
  assert.match(robots, /Disallow: \/admin/);
  assert.match(robots, /Disallow: \/booking\/success/);
});

test("production build declares the Node types required by Netlify functions", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  assert.ok(packageJson.devDependencies["@types/node"], "missing direct @types/node dependency");
});

test("production assets stay split and within performance budgets", async () => {
  const [html, assets, construction, responsiveHero, logo, socialCard] = await Promise.all([
    read("dist/index.html"),
    readdir(new URL("../dist/assets", import.meta.url)),
    stat(new URL("../dist/images/construction-cleaning.jpg", import.meta.url)),
    stat(new URL("../dist/images/revive-co-hero-768.jpg", import.meta.url)),
    stat(new URL("../dist/images/revive-homeservices-logo-compact.png", import.meta.url)),
    stat(new URL("../dist/images/og-revive-co.jpg", import.meta.url)),
  ]);
  const entry = html.match(/src="\/(assets\/index-[^"]+\.js)"/)?.[1];
  assert.ok(entry, "missing production entry script");
  assert.ok((await stat(new URL(`../dist/${entry}`, import.meta.url))).size < 230_000, "initial JavaScript exceeds 230 KB");
  assert.ok(assets.filter((name) => name.endsWith(".js")).length >= 4, "route bundles were not split");
  assert.ok(construction.size < 350_000, "construction image exceeds 350 KB");
  assert.ok(responsiveHero.size < 100_000, "responsive hero exceeds 100 KB");
  assert.ok(logo.size < 180_000, "site logo exceeds 180 KB");
  assert.ok(socialCard.size < 350_000, "social card exceeds 350 KB");
});
