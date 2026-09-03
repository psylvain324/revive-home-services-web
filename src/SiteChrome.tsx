import { useEffect, useRef, useState, type ReactNode } from "react";

export const PHONE_DISPLAY = "(480) 582-5615";
export const PHONE_LINK = "tel:+14805825615";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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
    <header className={`site-header${compact ? " site-header-solid" : ""}`}>
      <div className="container nav-row">
        <a className="brand" href="/#top" aria-label="Revive Co home">
          <img src="/images/revive-co-logo.webp" alt="Revive Co Residential and Commercial Services" />
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="/#services">Services</a>
          <a href="/#why-revive">Why Revive</a>
          <a href="/#process">How it works</a>
          <a href="/#contact">Contact</a>
        </nav>
        <a className="phone-link" href={PHONE_LINK} data-sv-action="phone" data-sv-label="header">{PHONE_DISPLAY}</a>
        <a className="button button-small desktop-cta" href="/book" data-sv-action="book" data-sv-label="header">Book now</a>
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
          <a href="/#process" onClick={close}>How it works</a>
          <a href="/#contact" onClick={close}>Contact</a>
          <a href={PHONE_LINK} onClick={close}>Call {PHONE_DISPLAY}</a>
          <a href="/book" onClick={close}>Book now</a>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <img src="/images/revive-co-logo.webp" alt="Revive Co" />
          <p>Professional residential and commercial cleaning with dependable scheduling and detail-minded care.</p>
          <a className="footer-phone" href={PHONE_LINK}>{PHONE_DISPLAY}</a>
        </div>
        <div>
          <h3>Services</h3>
          <nav aria-label="Footer services">
            <a href="/#services">Residential cleaning</a>
            <a href="/#services">Commercial cleaning</a>
            <a href="/#services">Move-in / move-out</a>
            <a href="/#services">Post-construction</a>
          </nav>
        </div>
        <div>
          <h3>Company</h3>
          <nav aria-label="Footer company links">
            <a href="/#why-revive">Why Revive</a>
            <a href="/#faq">FAQ</a>
            <a href="/#contact">Contact</a>
            <a href="/admin">Admin portal</a>
          </nav>
        </div>
        <div>
          <h3>Get started</h3>
          <p>Choose a service, see open times, and request your cleaning online.</p>
          <a className="button button-light" href="/book" data-sv-action="book" data-sv-label="footer">Book a cleaning</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <div>
          <span>© {new Date().getFullYear()} Revive Co. All rights reserved.</span>
          <a href="/privacy.html">Privacy</a>
          <a href="/terms.html">Terms</a>
          <a href="/accessibility.html">Accessibility</a>
        </div>
        <p className="creator-credit">
          Website &amp; growth systems by{" "}
          <a href="https://salesvisionconsulting.com" target="_blank" rel="noreferrer" data-sv-action="sales-vision-credit">
            Sales Vision Consulting
          </a>
        </p>
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
