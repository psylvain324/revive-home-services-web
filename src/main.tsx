import { lazy, StrictMode, Suspense, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import type { BookingKoalaEmbedKind } from "./BookingKoalaEmbed";
import { initializeSalesVision } from "./salesVision";
import "./styles.css";

const AdminPage = lazy(() => import("./AdminPage"));
const BookingKoalaPage = lazy(() => import("./BookingKoalaPage"));
const LegacyBookingStatusPage = lazy(() => import("./LegacyBookingStatusPage"));
const NotFoundPage = lazy(() => import("./NotFoundPage"));

const embedRoutes: Record<string, BookingKoalaEmbedKind> = {
  "/book": "book",
  "/contact": "contact",
  "/login": "login",
  "/reviews": "reviews",
  "/signup": "signup",
};

const attributionParameters = new Set(["fbclid", "gclid", "msclkid", "ttclid", "utm_campaign", "utm_content", "utm_medium", "utm_source", "utm_term"]);

function sanitizeCustomerQuery(path: string) {
  const supportsAttribution = path === "/" || Boolean(embedRoutes[path]);
  const isLegacyReturn = path === "/booking/success";
  if ((!supportsAttribution && !isLegacyReturn) || !window.location.search) return;
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of [...url.searchParams.keys()]) {
    if (supportsAttribution && attributionParameters.has(key)) continue;
    url.searchParams.delete(key);
    changed = true;
  }
  if (changed) window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

sanitizeCustomerQuery(window.location.pathname.replace(/\/$/, "") || "/");

const metadata: Record<string, { description: string; title: string }> = {
  "/": {
    description: "Professional residential and commercial cleaning from Revive Co. View services, read customer reviews, and book online.",
    title: "Revive Co | Residential & Commercial Cleaning",
  },
  "/book": {
    description: "View Revive Co cleaning services, current pricing, and availability, then book securely online.",
    title: "Book Cleaning Online | Revive Co",
  },
  "/booking/success": {
    description: "Verify the status of a booking made through Revive Co's retired website checkout.",
    title: "Previous Booking Status | Revive Co",
  },
  "/contact": {
    description: "Contact Revive Co about residential, commercial, move, or post-construction cleaning.",
    title: "Contact Revive Co | Cleaning Services",
  },
  "/login": {
    description: "Sign in to your Revive Co customer account to manage appointments and account details.",
    title: "Customer Login | Revive Co",
  },
  "/reviews": {
    description: "Read live feedback from Revive Co cleaning customers.",
    title: "Customer Reviews | Revive Co",
  },
  "/signup": {
    description: "Create a Revive Co customer account to book and manage cleaning appointments.",
    title: "Create Customer Account | Revive Co",
  },
  "/admin": {
    description: "Revive Co team operations portal.",
    title: "Operations Portal | Revive Co",
  },
};

function RouteFallback() {
  return <main id="main" className="route-loading" aria-busy="true" aria-label="Loading page" />;
}

document.querySelector<HTMLLinkElement>("#site-fonts")?.setAttribute("media", "all");

function Router() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  useEffect(() => {
    const pageMetadata = metadata[path] ?? { description: "The requested Revive Co page could not be found.", title: "Page Not Found | Revive Co" };
    const noIndex = !metadata[path] || ["/admin", "/booking/success", "/login", "/signup"].includes(path);
    document.title = pageMetadata.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", pageMetadata.description);
    document.querySelector('meta[name="robots"]')?.setAttribute("content", noIndex ? "noindex,nofollow" : "index,follow");
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute(
      "href",
      `https://www.revivecoservices.com${path === "/" ? "/" : path}`,
    );
  }, [path]);
  useEffect(() => {
    if (["/admin", "/booking/success"].includes(path)) return;
    return initializeSalesVision();
  }, [path]);
  if (embedRoutes[path]) return <Suspense fallback={<RouteFallback />}><BookingKoalaPage kind={embedRoutes[path]} /></Suspense>;
  if (path === "/booking/success") return <Suspense fallback={<RouteFallback />}><LegacyBookingStatusPage /></Suspense>;
  if (path === "/admin") return <Suspense fallback={<RouteFallback />}><AdminPage /></Suspense>;
  if (path === "/") return <App />;
  return <Suspense fallback={<RouteFallback />}><NotFoundPage /></Suspense>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
);
