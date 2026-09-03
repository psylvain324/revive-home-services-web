import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import AdminPage from "./AdminPage";
import App from "./App";
import BookingPage from "./BookingPage";
import BookingSuccessPage from "./BookingSuccessPage";
import "./styles.css";

function Router() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  useEffect(() => {
    const titles: Record<string, string> = { "/book": "Book a Cleaning | Revive Co", "/booking/success": "Booking Confirmed | Revive Co", "/admin": "Operations Portal | Revive Co" };
    document.title = titles[path] || "Revive Co | Residential & Commercial Cleaning";
    document.querySelector('meta[name="robots"]')?.setAttribute("content", path === "/admin" || path === "/booking/success" ? "noindex,nofollow" : "index,follow");
  }, [path]);
  if (path === "/book") return <BookingPage />;
  if (path === "/booking/success") return <BookingSuccessPage />;
  if (path === "/admin") return <AdminPage />;
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
);
