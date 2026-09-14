import { lazy, StrictMode, Suspense, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const AdminPage = lazy(() => import("./AdminPage"));
const BookingPage = lazy(() => import("./BookingPage"));
const BookingSuccessPage = lazy(() => import("./BookingSuccessPage"));

function RouteFallback() {
  return <main id="main" className="route-loading" aria-busy="true" aria-label="Loading page" />;
}

document.querySelector<HTMLLinkElement>("#site-fonts")?.setAttribute("media", "all");

function Router() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  useEffect(() => {
    const titles: Record<string, string> = { "/book": "Book a Cleaning | Revive Co", "/booking/success": "Booking Confirmed | Revive Co", "/admin": "Operations Portal | Revive Co" };
    document.title = titles[path] || "Revive Co | Residential & Commercial Cleaning";
    document.querySelector('meta[name="robots"]')?.setAttribute("content", path === "/admin" || path === "/booking/success" ? "noindex,nofollow" : "index,follow");
  }, [path]);
  if (path === "/book") return <Suspense fallback={<RouteFallback />}><BookingPage /></Suspense>;
  if (path === "/booking/success") return <Suspense fallback={<RouteFallback />}><BookingSuccessPage /></Suspense>;
  if (path === "/admin") return <Suspense fallback={<RouteFallback />}><AdminPage /></Suspense>;
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
);
