import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const origin = "https://www.revivecoservices.com";
const routes = {
  "/admin": {
    description: "Revive Co team operations portal.",
    robots: "noindex,nofollow",
    title: "Operations Portal | Revive Co",
  },
  "/book": {
    description: "View Revive Co cleaning services, current pricing, and availability, then book securely online.",
    robots: "index,follow",
    title: "Book Cleaning Online | Revive Co",
  },
  "/booking/success": {
    description: "Verify the status of a booking made through Revive Co's retired website checkout.",
    referrer: "no-referrer",
    robots: "noindex,nofollow",
    title: "Previous Booking Status | Revive Co",
  },
  "/contact": {
    description: "Contact Revive Co about residential, commercial, move, or post-construction cleaning.",
    robots: "index,follow",
    title: "Contact Revive Co | Cleaning Services",
  },
  "/login": {
    description: "Sign in to your Revive Co customer account to manage appointments and account details.",
    robots: "noindex,nofollow",
    title: "Customer Login | Revive Co",
  },
  "/reviews": {
    description: "Read live feedback from Revive Co cleaning customers.",
    robots: "index,follow",
    title: "Customer Reviews | Revive Co",
  },
  "/signup": {
    description: "Create a Revive Co customer account to book and manage cleaning appointments.",
    robots: "noindex,nofollow",
    title: "Create Customer Account | Revive Co",
  },
};

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeText(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function replaceMeta(html, attribute, key, content) {
  const expression = new RegExp(`<meta ${attribute}="${key}" content="[^"]*" \\/>`);
  return html.replace(expression, `<meta ${attribute}="${key}" content="${escapeAttribute(content)}" />`);
}

const outputDirectory = join(process.cwd(), "dist");
const base = await readFile(join(outputDirectory, "index.html"), "utf8");

await Promise.all(Object.entries(routes).map(async ([route, metadata]) => {
  const canonical = `${origin}${route}`;
  let html = base.replace(/<title>[^<]*<\/title>/, `<title>${escapeText(metadata.title)}</title>`);
  html = html.replace(/\s*<link rel="preload" as="image"[^>]*>\n?/, "\n");
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonical}" />`);
  html = replaceMeta(html, "name", "description", metadata.description);
  html = replaceMeta(html, "name", "robots", metadata.robots);
  html = replaceMeta(html, "property", "og:url", canonical);
  html = replaceMeta(html, "property", "og:title", metadata.title);
  html = replaceMeta(html, "property", "og:description", metadata.description);
  html = replaceMeta(html, "name", "twitter:title", metadata.title);
  html = replaceMeta(html, "name", "twitter:description", metadata.description);
  if (metadata.referrer) html = html.replace(/<meta name="robots"[^>]*>/, (tag) => `${tag}\n    <meta name="referrer" content="${metadata.referrer}" />`);

  const routeDirectory = join(outputDirectory, route.slice(1));
  await mkdir(routeDirectory, { recursive: true });
  await writeFile(join(routeDirectory, "index.html"), html);
}));

// Vite copies the whole public directory. Keep source photography available for
// future pages, but do not deploy assets that no current page or metadata uses.
const unusedDeployAssets = [
  "air-duct-cleaning.jpg",
  "carpet-cleaning.jpg",
  "hardwood-refinishing.jpg",
  "lakeville-best.svg",
  "revice_homeservices_logo.jpeg",
  "revive-co-logo-transparent.png",
  "revive-co-logo.webp",
  "revive-homeservices-logo.png",
  "revive-logo-stacked.svg",
  "revive-logo.svg",
  "revive-van.png",
  "upholstery-cleaning.jpg",
];
await Promise.all(unusedDeployAssets.map((name) => rm(join(outputDirectory, "images", name), { force: true })));
await rm(join(outputDirectory, ".DS_Store"), { force: true });
