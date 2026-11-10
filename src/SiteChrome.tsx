import { useEffect, useRef, useState, type ReactNode } from "react";
import { SiteIcon } from "./SiteIcon";

export const PHONE_DISPLAY = "(480) 582-5615";
export const PHONE_LINK = "tel:+14805825615";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const scrolledRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const next = window.scrollY > 4;
      if (next === scrolledRef.current) return;
      scrolledRef.current = next;
      setScrolled(next);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <header className={`site-header${compact ? " site-header-solid" : ""}${scrolled ? " is-scrolled" : ""}`}>
      <div className="container nav-row">
        <a className="brand" href="/#top" aria-label="Revive Co home">
          <img src="/images/revive-homeservices-logo-compact.png" alt="Revive Co Residential and Commercial Services" width="320" height="320" decoding="async" />
        </a>
        <div className="nav-center">
          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="/#services">Services</a>
            <a href="/#why-revive">Why Revive</a>
            <a href="/#reviews">Reviews</a>
            <a href="/#faq">FAQ</a>
            <a href="/contact" data-sv-action="contact-form" data-sv-label="header">Contact</a>
          </nav>
          <a className="phone-link" href={PHONE_LINK} data-sv-action="phone" data-sv-label="header">{PHONE_DISPLAY}</a>
        </div>
        <div className="nav-actions">
          <a className="account-link" href="/login">Customer Login</a>
          <a className="button button-small desktop-cta" href="/book" data-sv-action="book-service" data-sv-label="header">Book Now</a>
        </div>
        <button
          className="menu-button"
          type="button"
          ref={menuButtonRef}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>
      </div>
      {menuOpen && (
        <nav className="mobile-menu is-open" id="mobile-menu" aria-label="Mobile navigation">
          <a href="/#services" onClick={close}>Services</a>
          <a href="/#why-revive" onClick={close}>Why Revive</a>
          <a href="/#reviews" onClick={close}>Reviews</a>
          <a href="/#faq" onClick={close}>FAQ</a>
          <a href="/contact" onClick={close} data-sv-action="contact-form" data-sv-label="mobile-menu">Contact</a>
          <a href={PHONE_LINK} onClick={close}>Call {PHONE_DISPLAY}</a>
          <a href="/login" onClick={close}>Customer Login</a>
          <a href="/signup" onClick={close}>Create Account</a>
          <a href="/book" onClick={close}>Book Now</a>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-logo">
          <img src="/images/revive-homeservices-logo-compact.png" alt="Revive Co" width="320" height="320" loading="lazy" decoding="async" />
        </div>
        <div className="footer-brand">
          <h3>Revive Co</h3>
          <p>Professional residential and commercial cleaning with personal follow-through and detail-minded care.</p>
          <a className="footer-phone" href={PHONE_LINK}><SiteIcon name="phone" />{PHONE_DISPLAY}</a>
        </div>
        <div>
          <h3>Services</h3>
          <nav aria-label="Footer services">
            <a href="/#services">Residential Cleaning</a>
            <a href="/#services">Commercial Cleaning</a>
            <a href="/#services">Move-In / Move-Out</a>
            <a href="/#services">Post-Construction</a>
          </nav>
        </div>
        <div>
          <h3>Company</h3>
          <nav aria-label="Footer company links">
            <a href="/#why-revive">Why Revive</a>
            <a href="/reviews">Customer Reviews</a>
            <a href="/#faq">FAQ</a>
            <a href="/contact" data-sv-action="contact-form" data-sv-label="footer">Contact</a>
            <a href="/login">Customer Login</a>
            <a href="/signup">Create Account</a>
          </nav>
        </div>
        <div>
          <h3>Get Started</h3>
          <p>Choose a service, see availability, and book your cleaning online.</p>
          <a className="button button-light" href="/book" data-sv-action="book-service" data-sv-label="footer">Book a Cleaning</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <div>
          <span>© {new Date().getFullYear()} Revive Co. All rights reserved.</span>
          <a href="/privacy.html">Privacy</a>
          <a href="/terms.html">Terms</a>
          <a href="/accessibility.html">Accessibility</a>
        </div>
        <div className="creator-credit">
          <img src="/images/phillip-sylvain.jpg" alt="Phillip Sylvain" width="240" height="240" loading="lazy" decoding="async" />
          <p>Website created by <span>Phillip Sylvain</span> @{" "}<a href="https://salesvisionconsulting.com" target="_blank" rel="noreferrer" data-sv-action="sales-vision-credit">Sales Vision Consulting</a></p>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ children, compactHeader = false }: { children: ReactNode; compactHeader?: boolean }) {
  return (
    <div className="site-shell" data-salesvision-site="revive-co">
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader compact={compactHeader} />
      {children}
      <SiteFooter />
    </div>
  );
}
