# Revive Home Services

A production-ready marketing website for Revive Home Services, serving the Twin Cities metro with carpet, air duct, hardwood, upholstery, tile, grout, and LVP care.

## Local development

Requirements: Node.js 22 or newer.

```bash
npm install
npm run dev
```

The local site runs at `http://localhost:5173` by default.

## Quality checks

```bash
npm run lint
npm test
npm run audit:site
```

`npm test` runs the TypeScript check, production build, and deployment-contract tests. `npm run audit:site` adds linting and a complete dependency security audit.

## Netlify deployment

The repository is configured for automatic Netlify deployment:

- Build command: `npm run build`
- Publish directory: `dist`
- Node.js: 22
- Request form: Netlify Forms (`service-request`)
- Success page: `/thank-you.html`

Import the GitHub repository into Netlify and leave the detected build settings unchanged. After the first deploy, enable form notifications in Netlify if email alerts are required.

The root `netlify.toml` also applies security headers, cache policies, and the single-page fallback.

## Business content

Public contact details, services, service areas, pricing, and outbound review/social links are based on Revive Home Services' current public information. Update prices in `src/App.tsx` when promotions or published rates change.
