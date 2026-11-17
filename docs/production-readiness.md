# Production readiness audit

Audit date: November 16, 2026  
Target: Netlify at `https://www.revivecoservices.com/`  
Release decision: **Blocked by external configuration; application code passes the release gate.**

## Verified application results

| Area | Result | Evidence |
| --- | --- | --- |
| Type safety | Pass | `npm run check` |
| Lint and accessibility rules | Pass | `npm run lint` |
| Production build and contracts | Pass | `npm test` — 24 of 24 tests |
| Netlify build gate | Pass | `npm run build:netlify` runs lint, build, and all tests |
| Netlify Functions packaging | Pass | 12 functions packaged with Netlify CLI 27.19.0 |
| Admin login throttling | Pass | Packaged manifest contains 10 attempts per IP per 900 seconds |
| Resend test throttling | Pass | Packaged manifest contains 2 attempts per IP per 3,600 seconds |
| Production dependencies | Pass | `npm audit --omit=dev --audit-level=high` reports 0 vulnerabilities |
| Full dependency graph | Advisory | 7 moderate `minimatch` findings are confined to lint/development tooling; no high or critical findings |
| Secret scan | Pass | No high-confidence credential was found in tracked application files |
| Responsive browser QA | Pass | No horizontal overflow at 390 px, 768 px, or 1,440 px widths |
| Host routes and interactions | Pass | Home, booking, login, signup, contact, reviews, admin, legal pages, FAQ, navigation, and 404 rendered correctly |
| Review outage behavior | Pass | Empty vendor feed is replaced after the resize timeout by an accessible customer-facing fallback |
| Resend library and endpoint | Pass with mocked provider | Fixed recipient, server-only key, authenticated endpoint, timeout, idempotency, sanitized errors, and security headers tested |

The local private Resend file is `.env.resend.local`, is ignored by Git, and has owner-only file permissions. It deliberately contains no active credential in this checkout.

## Release blockers

### 1. BookingKoala tenant is not customer-ready

The host integration loads and resizes all five allowlisted embeds. The tenant content returned on the audit date still has production-blocking vendor configuration defects:

- `/book` displays BookingKoala template instructions such as how a generic business can configure forms, providers, locations, and payment processing.
- Booking, login, signup, and contact surfaces render `undefinedundefinedundefinedundefined` in tenant footer content.
- The contact form logs five BookingKoala plugin-install errors.
- The live-reviews endpoint has no renderable review feed. The website now fails gracefully, but a production review feed still needs to be enabled and populated.
- Several extras share the accessible name `extras`, and some vendor sign-up fields lack useful accessible names.
- Pricing, frequencies, payment behavior, cancellation wording, consent language, notification templates, service areas, availability, and operational promises require account-owner approval.

These issues are inside the cross-origin BookingKoala tenant and cannot be repaired by host-site code. Complete the tenant checklist in the main README, then run a controlled booking, contact, login, signup, reschedule/cancel, notification, and payment-processor test. Do not use a live card until the processor is intentionally placed in its approved test workflow.

Reference: [BookingKoala embed documentation](https://help.bookingkoala.com/help/embed-the-forms-on-your-existing-website).

### 2. Resend has no active credential or verified sender here

`RESEND_API_KEY` and `RESEND_FROM_EMAIL` are unset, so `npm run email:check` correctly fails closed. A real provider delivery was not attempted and must not be represented as successful.

For the developer test environment, add the active test key and verified sender to the ignored `.env.resend.local`, then run:

```bash
npm run email:check
npm run email:test
```

For every client, create a separate sending-only Resend key, verify that client's sender domain, and configure the four `RESEND_*` values as scoped, sensitive Netlify environment variables. First verify provider acceptance with `delivered@resend.dev`; then, when inbox delivery is required, change the fixed test recipient to an inbox controlled by the client and use the protected admin check.

References: [Resend Node.js sending guide](https://resend.com/docs/send-with-nodejs), [domain verification](https://resend.com/docs/dashboard/domains/introduction), [test addresses](https://resend.com/changelog/sending-test-emails), and [Netlify Function environment variables](https://docs.netlify.com/build/functions/environment-variables/).

### 3. Netlify site and production environment are not linked

`.netlify/state.json` is `{}`. The correct Netlify site, database, environment variables, deploy contexts, and remote Function behavior therefore remain unverified. Link only the intended client site, initialize or attach its database, configure the required variables, and deploy a draft before production.

An older Git commit contained a hard-coded administrator credential. Even though the current source has no fallback credential, rotate that historical password anywhere it may have been used. Generate a new admin hash and an independent random session secret for this deployment.

### 4. Canonical DNS and TLS are broken

On the audit date, `www.revivecoservices.com` pointed to the misspelled and unclaimed `revive-homservices.netlify.app`; the intended Netlify hostname is `revive-homeservices.netlify.app`. The apex and `www` hostnames did not pass canonical TLS validation.

Remove the dangling target, attach both custom domains to the intended Netlify site, provision the certificate, select the primary-domain redirect, and retest DNS, TLS, redirects, headers, sitemap, robots, and every public route.

## Release sequence

1. Correct and approve all BookingKoala tenant content and policies.
2. Add the developer Resend key locally and complete the opt-in delivery test.
3. Link this checkout to the intended Netlify site and configure database, admin, session, and client-owned Resend variables.
4. Run `npm run audit:deploy` and a pinned Netlify offline build.
5. Deploy a draft and repeat desktop/mobile route, Function, email, and BookingKoala end-to-end checks.
6. Repair custom-domain DNS/TLS and verify the draft through the canonical hostname.
7. Rotate the historical admin credential, approve the release checklist, and only then deploy with `--prod`.
