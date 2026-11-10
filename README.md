# Revive Co website

Production React/Vite website for Revive Co, configured for Netlify and integrated directly with the company's BookingKoala tenant for booking, customer accounts, contact, and live reviews.

## Customer experience

- `/book` — secure BookingKoala booking form with live service options, pricing, and availability
- `/login` — customer account sign-in
- `/signup` — customer account creation
- `/contact` — BookingKoala contact form
- `/reviews` — full live-review page
- `/#reviews` — lazily loaded live reviews on the home page
- `/admin` — separate legacy Revive operations portal; it is not the customer login
- `/booking/success` — private, non-embedded status guidance for customers returning from the retired Stripe checkout
- `/thank-you.html` — private compatibility page for the retired contact form

The integration is centralized in `src/BookingKoalaEmbed.tsx`. It uses a fixed, allowlisted BookingKoala origin, one configuration map for all five forms, a pinned and locally bundled responsive iframe controller with origin validation, accessible iframe titles, lazy loading for below-the-fold reviews, and direct-link fallbacks for browsers that restrict embedded authentication or payment flows.

The retired first-party booking, payment, availability, inquiry, settings, and Stripe webhook endpoints have been removed so there is only one public system of record: BookingKoala. Historical booking and inquiry records remain available read-only in the internal admin portal.

## Local development

Requires Node.js 22 or newer.

```bash
npm ci
npm run dev
```

Vite serves the UI at `http://localhost:5173`. The BookingKoala frames load from `https://reviveco.bookingkoala.com`, so an internet connection is required to exercise the embedded experiences. The iframe-resizer parent is bundled locally and loaded on demand.

## Required Netlify environment variables

The public BookingKoala integration does not require client-side secrets. The separate internal operations portal fails closed unless all of these server-side variables are configured:

| Variable | Purpose |
| --- | --- |
| `NETLIFY_DB_URL` | Netlify Database connection used by the internal operations portal |
| `ADMIN_EMAIL` | Case-insensitive administrator email |
| `ADMIN_PASSWORD_HASH` | Scrypt hash generated with `npm run admin:hash` and its hidden password prompt |
| `SESSION_SECRET` | Random secret containing at least 32 characters |

Never commit real values. `.env` and Netlify local state are ignored by Git. The admin login has no hard-coded fallback credential and is protected by Netlify's IP-based rate limiting.

## BookingKoala production checklist

Code integration alone does not configure the BookingKoala tenant. Before launch, an account owner must verify the following in BookingKoala:

1. Correct the contact phone number, logo, social links, form instructions, terms, privacy text, and SMS/marketing consent wording.
2. Confirm service areas, services, prices, extras, frequencies, taxes, availability, provider schedules, booking limits, cancellation rules, and notification templates.
3. Connect and verify the intended payment processor and test any required 3DS2 flow.
4. Remove sample customers, bookings, and reviews.
5. Enable live reviews, set the rating threshold, and choose how much of each customer's name is displayed.
6. Configure analytics and conversion events inside BookingKoala as well as on the host site; cross-origin iframe activity is not visible to host-page analytics.
7. Run one controlled test booking and verify the customer confirmation, account dashboard, admin booking, email/SMS notifications, rescheduling/cancellation behavior, and payment behavior without charging a live card.
8. Reconcile every in-flight booking and Stripe Checkout session from the retired website before launch; the private legacy status page intentionally does not infer payment success.

BookingKoala documents the supported third-party embeds in its [official embed guide](https://help.bookingkoala.com/help/embed-the-forms-on-your-existing-website).

## Security model

- Content Security Policy allows only first-party scripts and permits frames only from the exact Revive BookingKoala origin.
- Payment capability is delegated only to the BookingKoala frame.
- Account utility routes are `noindex`, use private/no-store caching, and expose a top-level fallback link.
- The pinned local iframe controller is loaded only when a BookingKoala iframe becomes active, and validates resize messages against the iframe's exact origin.
- URLs are fixed in source; arbitrary iframe origins cannot be supplied at runtime.
- Embed-host query strings are reduced to an explicit marketing-attribution allowlist before the iframe loads. Personal information, reset tokens, payment session IDs, and credentials must never be placed in an embed-page URL. Only allowlisted campaign parameters are deliberately appended to the iframe URL.
- Referrers are reduced to origins at the response and iframe levels; legacy transaction pages use `no-referrer`.
- Full card details remain with the payment processor connected to BookingKoala, not this website.
- Host analytics report page views and outbound booking/contact/phone clicks only. Booking completion, revenue, and in-frame behavior must be measured in BookingKoala.
- A non-public Netlify scheduled function removes host analytics older than 400 days weekly instead of adding maintenance work to visitor requests.

## Verification

```bash
npm run check
npm run lint
npm test
npm audit --audit-level=high
npm audit --omit=dev --audit-level=high
```

`npm test` builds the production bundle and verifies the deployment contract, all five embed URLs, route metadata, Content Security Policy, privacy disclosures, removal of legacy public APIs, fail-closed admin authentication, and performance budgets.

## Netlify deployment

The project is configured for Node 22, `npm run build`, the `dist` publish directory, Netlify Functions, prerendered route metadata, a real static 404, immutable hashed assets, HSTS, and route-specific security headers.

For a new local link:

```bash
npx netlify login
npx netlify link
npm ci
npm run audit:site
npx netlify build --offline
npx netlify deploy --build
```

Use `npx netlify deploy --build --prod` only after the BookingKoala checklist and a draft deploy have passed. The canonical production domain is `https://www.revivecoservices.com/`.

Before production deployment, repair the custom-domain configuration: the current `www` CNAME points to the misspelled and unclaimed `revive-homservices.netlify.app`. Remove that dangling target, attach the apex and `www` domains to the intended Netlify site, provision TLS, choose the primary-domain redirect, and verify every route and response header at the canonical domain.

## Operational notes

- Customers should use `/login`, not `/admin`.
- The internal expense ledger is intentionally not combined with BookingKoala revenue and is not accounting or tax-filing software.
- The footer credit and `data-salesvision-site` marker identify the Sales Vision Consulting implementation.
