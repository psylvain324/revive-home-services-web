import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("build emits the public pages and core assets", async () => {
  await Promise.all([
    access(new URL("../dist/index.html", import.meta.url)),
    access(new URL("../dist/thank-you.html", import.meta.url)),
    access(new URL("../dist/images/revive-logo.svg", import.meta.url)),
    access(new URL("../dist/images/carpet-cleaning.jpg", import.meta.url)),
    access(new URL("../dist/robots.txt", import.meta.url)),
    access(new URL("../dist/sitemap.xml", import.meta.url)),
  ]);
});

test("static HTML exposes metadata and the Netlify form blueprint", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /<title>Revive Home Services \| Twin Cities Cleaning Experts<\/title>/);
  assert.match(html, /name="description"/);
  assert.match(html, /rel="canonical" href="https:\/\/revivecleanmn\.com\/"/);
  assert.match(html, /property="og:url" content="https:\/\/revivecleanmn\.com\/"/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /name="twitter:image"/);
  assert.match(html, /name="service-request"/);
  assert.match(html, /data-netlify="true"/);
  assert.match(html, /netlify-honeypot="bot-field"/);
  assert.match(html, /name="bot-field"/);
});

test("source keeps primary contact and attribution links functional", async () => {
  const source = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  assert.match(source, /tel:\+19522228309/);
  assert.match(source, /mailto:/);
  assert.match(source, /https:\/\/salesvisionconsulting\.com/);
  assert.match(source, /Website created by/);
  assert.match(source, /action="\/thank-you\.html"/);
  assert.match(source, /100% satisfaction guarantee/);
});

test("Netlify uses the verified Vite build and hardened headers", async () => {
  const config = await readFile(new URL("../netlify.toml", import.meta.url), "utf8");
  assert.match(config, /command = "npm run build"/);
  assert.match(config, /publish = "dist"/);
  assert.match(config, /Content-Security-Policy/);
  assert.match(config, /X-Content-Type-Options/);
  assert.match(config, /from = "\/\*"/);
});

test("the package is rooted at the Revive repository", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(packageJson.name, "revive-home-services-web");
  assert.equal(packageJson.scripts.build, "tsc --noEmit && vite build");
  assert.equal(packageJson.scripts.test, "npm run build && node --test tests/site.test.mjs");
});
