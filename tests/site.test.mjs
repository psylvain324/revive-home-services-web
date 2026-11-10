import assert from "node:assert/strict";
import { access, readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const missing = async (path) => assert.rejects(access(new URL(`../${path}`, import.meta.url)));

test("production build emits the complete customer-facing site", async () => {
  await Promise.all([
    "dist/index.html", "dist/404.html", "dist/privacy.html", "dist/terms.html", "dist/accessibility.html", "dist/thank-you.html",
    "dist/images/revive-homeservices-logo-compact.png",
    "dist/images/favicon.png", "dist/images/phillip-sylvain.jpg", "dist/images/revive-co-hero.jpg",
    "dist/images/revive-co-hero-768.jpg", "dist/images/og-revive-co.jpg",
    "dist/images/construction-cleaning.jpg", "dist/images/construction-cleaning-768.jpg",
    "dist/robots.txt", "dist/sitemap.xml",
  ].map((path) => access(new URL(`../${path}`, import.meta.url))));

  await Promise.all([
    "dist/.DS_Store",
    "dist/images/air-duct-cleaning.jpg",
    "dist/images/carpet-cleaning.jpg",
    "dist/images/hardwood-refinishing.jpg",
    "dist/images/lakeville-best.svg",
    "dist/images/revice_homeservices_logo.jpeg",
    "dist/images/revive-co-logo-transparent.png",
    "dist/images/revive-co-logo.webp",
    "dist/images/revive-homeservices-logo.png",
    "dist/images/revive-logo-stacked.svg",
    "dist/images/revive-logo.svg",
    "dist/images/revive-van.png",
    "dist/images/upholstery-cleaning.jpg",
  ].map(missing));
});

test("metadata uses the correct Revive Co identity and booking-first message", async () => {
  const [html, main] = await Promise.all([read("dist/index.html"), read("src/main.tsx")]);
  assert.match(html, /<title>Revive Co \| Residential &amp; Commercial Cleaning<\/title>/);
  assert.match(html, /https:\/\/www\.revivecoservices\.com\//);
  assert.match(html, /book securely online/i);
  assert.match(html, /images\/og-revive-co\.jpg/);
  assert.doesNotMatch(html, /service request|Twin Cities|revivecleanmn/i);
  for (const route of ["/book", "/contact", "/login", "/signup", "/reviews"]) assert.match(main, new RegExp(`"${route.replace("/", "\\/")}"`));
  assert.match(main, /noindex,nofollow/);
  assert.match(main, /link\[rel="canonical"\]/);
});

test("production build prerenders route-specific metadata for crawlers", async () => {
  const expected = {
    "admin": ["Operations Portal | Revive Co", "noindex,nofollow"],
    "book": ["Book Cleaning Online | Revive Co", "index,follow"],
    "booking/success": ["Previous Booking Status | Revive Co", "noindex,nofollow"],
    "contact": ["Contact Revive Co | Cleaning Services", "index,follow"],
    "login": ["Customer Login | Revive Co", "noindex,nofollow"],
    "reviews": ["Customer Reviews | Revive Co", "index,follow"],
    "signup": ["Create Customer Account | Revive Co", "noindex,nofollow"],
  };
  for (const [route, [title, robots]] of Object.entries(expected)) {
    const html = await read(`dist/${route}/index.html`);
    assert.ok(html.includes(`<title>${title}</title>`), `wrong title for /${route}`);
    assert.ok(html.includes(`content="${robots}"`), `wrong robots policy for /${route}`);
    assert.ok(html.includes(`href="https://www.revivecoservices.com/${route}"`), `wrong canonical for /${route}`);
    assert.doesNotMatch(html, /rel="preload" as="image"/, `homepage hero should not preload on /${route}`);
  }
  assert.match(await read("dist/booking/success/index.html"), /name="referrer" content="no-referrer"/);
});

test("all BookingKoala experiences share one hardened embed implementation", async () => {
  const [embed, page, app, chrome, main, analytics] = await Promise.all([
    read("src/BookingKoalaEmbed.tsx"),
    read("src/BookingKoalaPage.tsx"),
    read("src/App.tsx"),
    read("src/SiteChrome.tsx"),
    read("src/main.tsx"),
    read("src/salesVision.ts"),
  ]);

  for (const path of [
    "/booknow?embed=true",
    "/login?embed=true",
    "/signup?embed=true",
    "/contact-us?embed=true",
    "/live-reviews/?embed=true",
  ]) assert.ok(embed.includes(path), `missing BookingKoala embed path: ${path}`);

  assert.match(embed, /https:\/\/reviveco\.bookingkoala\.com/);
  assert.match(embed, /import\("iframe-resizer\/js\/iframeResizer"\)/);
  assert.match(embed, /checkOrigin: true/);
  assert.match(embed, /warningTimeout: 0/);
  assert.match(embed, /removeListeners/);
  assert.doesNotMatch(embed, /\/resources\/embed\.js|checkOrigin: false/);
  assert.match(embed, /IntersectionObserver/);
  assert.match(embed, /title=\{definition\.title\}/);
  assert.match(embed, /target="_blank" rel="noopener noreferrer"/);
  assert.match(embed, /allow=\{kind === "book" \? "payment"/);
  assert.doesNotMatch(embed, /window\.location\.search|new URLSearchParams/);
  assert.match(page, /Securely provided by BookingKoala/);
  assert.match(app, /<BookingKoalaEmbed kind="reviews" deferUntilVisible/);
  assert.match(app, /href="\/book"/);
  assert.match(chrome, /href="\/login"/);
  assert.match(chrome, /href="\/signup"/);
  assert.doesNotMatch(app, /<form|\/api\/inquiries|request-only/i);
  assert.match(main, /attributionParameters/);
  assert.match(main, /history\.replaceState/);
  assert.match(main, /path === "\/booking\/success"/);
  for (const sensitive of ["session_id", "email", "phone", "token"]) assert.ok(!main.match(new RegExp(`attributionParameters[^;]+${sensitive}`)));
  assert.match(analytics, /landingPage: window\.location\.pathname/);
  assert.doesNotMatch(analytics, /landingPage:.*location\.search/);
  assert.match(analytics, /getBookingKoalaAttributionParameters/);
  assert.match(analytics, /normalizeSavedAttribution/);
  assert.match(analytics, /typeof value === "string"/);
  assert.match(embed, /getBookingKoalaAttributionParameters/);
});

test("legacy public booking and payment APIs are removed", async () => {
  const functions = await readdir(new URL("../netlify/functions", import.meta.url));
  for (const name of [
    "availability.mts",
    "bookings.mts",
    "inquiries.mts",
    "payment-status.mts",
    "public-config.mts",
    "stripe-webhook.mts",
    "admin-settings.mts",
  ]) assert.ok(!functions.includes(name), `legacy endpoint still deployed: ${name}`);

  await Promise.all([
    missing("src/BookingPage.tsx"),
    missing("src/BookingSuccessPage.tsx"),
  ]);

  const [legacyStatus, retiredThankYou] = await Promise.all([read("src/LegacyBookingStatusPage.tsx"), read("public/thank-you.html")]);
  assert.match(legacyStatus, /do not submit a replacement booking/i);
  assert.doesNotMatch(legacyStatus, /BookingKoalaEmbed|session_id/);
  assert.match(retiredThankYou, /retired website contact form/i);
  assert.match(retiredThankYou, /referrerpolicy="no-referrer"/);

  const [packageJson, envExample] = await Promise.all([read("package.json"), read(".env.example")]);
  assert.doesNotMatch(packageJson, /"stripe"/);
  assert.doesNotMatch(envExample, /STRIPE_|RESEND_|CONTACT_FROM_/);
});

test("admin authentication requires environment credentials and platform rate limiting", async () => {
  const [adminLogin, passwordHasher] = await Promise.all([
    read("netlify/functions/admin-login.mts"),
    read("scripts/hash-admin-password.mjs"),
  ]);
  assert.match(adminLogin, /process\.env\.ADMIN_EMAIL/);
  assert.match(adminLogin, /process\.env\.ADMIN_PASSWORD_HASH/);
  assert.match(adminLogin, /Administrator access is not configured/);
  assert.match(adminLogin, /rateLimit/);
  assert.match(adminLogin, /aggregateBy: \["ip"\]/);
  for (const forbidden of ["STATIC_ADMIN", ["password", "123"].join(""), ["psylvain324", "gmail.com"].join("@")]) {
    assert.ok(!adminLogin.includes(forbidden), `hard-coded admin credential found: ${forbidden}`);
  }
  assert.doesNotMatch(adminLogin, /scrypt\$[a-f0-9]/);
  assert.doesNotMatch(passwordHasher, /process\.argv/);
  assert.match(passwordHasher, /setRawMode\(true\)/);
});

test("Netlify policy narrowly allows BookingKoala and protects account routes", async () => {
  const config = await read("netlify.toml");
  assert.match(config, /command = "npm run build"/);
  assert.match(config, /publish = "dist"/);
  assert.match(config, /directory = "netlify\/functions"/);
  assert.match(config, /frame-src https:\/\/reviveco\.bookingkoala\.com/);
  assert.match(config, /script-src 'self';/);
  assert.doesNotMatch(config, /script-src 'self' https:\/\/reviveco\.bookingkoala\.com/);
  assert.match(config, /payment=\(self \\"https:\/\/reviveco\.bookingkoala\.com\\"\)/);
  assert.match(config, /Cross-Origin-Opener-Policy = "same-origin-allow-popups"/);
  for (const route of ["/admin", "/booking/success", "/login", "/signup", "/thank-you.html"]) {
    assert.ok(config.includes(`for = "${route}"`), `missing private headers for ${route}`);
  }
  assert.ok((config.match(/X-Robots-Tag = "noindex, nofollow"/g) ?? []).length >= 5);
  assert.match(config, /Referrer-Policy = "origin"/);
  assert.doesNotMatch(config, /from = "\/booking\/success"/);
  assert.doesNotMatch(config, /from = "\/\*"/);
});

test("unknown routes use a real noindex 404 instead of a homepage fallback", async () => {
  const [notFound, main, config] = await Promise.all([read("dist/404.html"), read("src/main.tsx"), read("netlify.toml")]);
  assert.match(notFound, /Page Not Found/);
  assert.match(notFound, /noindex,nofollow/);
  assert.match(main, /<NotFoundPage/);
  assert.doesNotMatch(config, /to = "\/index\.html"/);
});

test("host analytics stay separate from BookingKoala and legacy revenue", async () => {
  const [adminAnalytics, dashboard, admin, track, retention] = await Promise.all([
    read("netlify/functions/admin-analytics.mts"),
    read("netlify/functions/admin-dashboard.mts"),
    read("src/AdminPage.tsx"),
    read("netlify/functions/track.mts"),
    read("netlify/functions/analytics-retention.mts"),
  ]);
  assert.match(adminAnalytics, /booking_clicks/);
  assert.match(adminAnalytics, /contact_clicks/);
  assert.doesNotMatch(adminAnalytics, /FROM bookings|JOIN sales|booking_step|inquiry_submitted/);
  assert.doesNotMatch(dashboard, /analytics_events|conversionRate/);
  assert.doesNotMatch(dashboard, /netCents|estimatedTaxCents|estimated_tax_rate/);
  assert.match(admin, /host-website engagement metrics only/i);
  assert.match(admin, /reported in BookingKoala/);
  assert.match(admin, /expense ledger is intentionally separate from BookingKoala revenue/i);
  assert.match(track, /allowedEvents/);
  assert.match(track, /allowedActions/);
  assert.match(track, /rateLimit/);
  assert.match(track, /aggregateBy: \["ip"\]/);
  assert.doesNotMatch(track, /DELETE FROM analytics_events/);
  assert.doesNotMatch(track, /new Map/);
  assert.match(retention, /interval '400 days'/);
  assert.match(retention, /schedule: "@weekly"/);
});

test("legacy operations UI clearly delegates current operations to BookingKoala", async () => {
  const [admin, bookingsEndpoint, inquiriesEndpoint] = await Promise.all([
    read("src/AdminPage.tsx"),
    read("netlify/functions/admin-bookings.mts"),
    read("netlify/functions/admin-inquiries.mts"),
  ]);
  assert.match(admin, /BookingKoala is the active booking system/);
  assert.match(admin, /historical website data only/i);
  assert.match(admin, /retired website settings are no longer exposed/i);
  assert.doesNotMatch(admin, /Requires Stripe keys in Netlify|Save all settings|Block Time Off/);
  assert.match(bookingsEndpoint, /Historical booking records are read-only/);
  assert.match(inquiriesEndpoint, /Historical inquiry records are read-only/);
  assert.doesNotMatch(bookingsEndpoint, /UPDATE bookings|DELETE FROM booking_slots/);
  assert.doesNotMatch(inquiriesEndpoint, /UPDATE inquiries/);
});

test("privacy, terms, accessibility, sitemap, and robots match the new integration", async () => {
  const [privacy, terms, accessibility, sitemap, robots] = await Promise.all([
    read("public/privacy.html"),
    read("public/terms.html"),
    read("public/accessibility.html"),
    read("public/sitemap.xml"),
    read("public/robots.txt"),
  ]);
  assert.match(privacy, /BookingKoala Forms and Accounts/);
  assert.match(privacy, /bookingkoala\.com\/privacy-policy/);
  assert.match(privacy, /does not receive or store your full card number/);
  assert.match(terms, /Online Booking Terms/);
  assert.match(terms, /Bookings and Confirmation/);
  assert.doesNotMatch(terms, /not an appointment scheduler|does not reserve a date/);
  assert.match(accessibility, /direct-open link/);
  for (const route of ["/book", "/contact", "/reviews"]) assert.ok(sitemap.includes(`revivecoservices.com${route}`));
  for (const route of ["/admin", "/booking/success", "/login", "/signup", "/thank-you.html"]) assert.ok(robots.includes(`Disallow: ${route}`));
});

test("internal operations endpoints and transactional history schema remain available", async () => {
  const functions = await readdir(new URL("../netlify/functions", import.meta.url));
  for (const name of [
    "admin-login.mts", "admin-session.mts", "admin-logout.mts",
    "admin-dashboard.mts", "admin-bookings.mts", "admin-inquiries.mts", "admin-customers.mts",
    "admin-expenses.mts", "admin-analytics.mts", "analytics-retention.mts", "track.mts",
  ]) assert.ok(functions.includes(name), `missing internal endpoint: ${name}`);

  const migration = await read("netlify/database/migrations/0001_revive_platform/migration.sql");
  for (const table of ["admin_settings", "customers", "bookings", "inquiries", "expenses", "analytics_events"]) {
    assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
});

test("production build declares the Node types required by Netlify functions", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  assert.ok(packageJson.devDependencies["@types/node"], "missing direct @types/node dependency");
  assert.equal(packageJson.dependencies["iframe-resizer"], "4.3.11");
  assert.equal(packageJson.overrides.zod, "^4.6.6");
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
  assert.ok(assets.filter((name) => name.endsWith(".js")).length >= 3, "route bundles were not split");
  assert.ok(assets.some((name) => name.startsWith("BookingKoalaPage-")), "BookingKoala route is not lazy-loaded");
  assert.ok(construction.size < 350_000, "construction image exceeds 350 KB");
  assert.ok(responsiveHero.size < 100_000, "responsive hero exceeds 100 KB");
  assert.ok(logo.size < 180_000, "site logo exceeds 180 KB");
  assert.ok(socialCard.size < 350_000, "social card exceeds 350 KB");
});
