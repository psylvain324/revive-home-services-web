import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { SiteIcon } from "./SiteIcon";

export const PHONE_DISPLAY = "(480) 582-5615";
export const PHONE_LINK = "tel:+14805825615";

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/", icon: "instagram" },
  { label: "Facebook", href: "https://www.facebook.com/", icon: "facebook" },
  { label: "LinkedIn", href: "https://www.linkedin.com/", icon: "linkedin" },
  { label: "Google Maps", href: "https://www.google.com/maps/", icon: "maps" },
] as const;

function SocialIcon({ name }: { name: (typeof socialLinks)[number]["icon"] }) {
  const instagramGradientId = useId();

  if (name === "instagram") {
    return <svg className="brand-social-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><radialGradient id={instagramGradientId} cx="30%" cy="105%" r="115%"><stop offset="0" stopColor="#ffd600" /><stop offset=".27" stopColor="#ff7a00" /><stop offset=".55" stopColor="#ff0169" /><stop offset=".8" stopColor="#d300c5" /><stop offset="1" stopColor="#7638fa" /></radialGradient></defs><rect width="24" height="24" rx="6" fill={`url(#${instagramGradientId})`} /><rect x="5.25" y="5.25" width="13.5" height="13.5" rx="4" fill="none" stroke="#fff" strokeWidth="1.8" /><circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" strokeWidth="1.8" /><circle cx="17.25" cy="6.9" r="1.05" fill="#fff" /></svg>;
  }
  if (name === "facebook") {
    return <svg className="brand-social-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1877f2" /><path fill="#fff" d="M13.6 20v-7h2.35l.35-2.73h-2.7V8.53c0-.79.22-1.33 1.36-1.33h1.45V4.76a19.5 19.5 0 0 0-2.11-.11c-2.09 0-3.52 1.28-3.52 3.62v2H8.42V13h2.36v7h2.82Z" /></svg>;
  }
  if (name === "linkedin") {
    return <svg className="brand-social-icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#0a66c2" /><circle cx="6.7" cy="7" r="1.65" fill="#fff" /><rect x="5.3" y="9.5" width="2.8" height="9.1" fill="#fff" /><path fill="#fff" d="M10 9.5h2.7v1.25h.04c.38-.72 1.3-1.48 2.68-1.48 2.87 0 3.4 1.89 3.4 4.34v4.99H16v-4.42c0-1.05-.02-2.41-1.47-2.41-1.47 0-1.7 1.15-1.7 2.34v4.49H10V9.5Z" /></svg>;
  }
  return <svg className="brand-social-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#34a853" d="M12 23c2.55-3.2 6.8-7.54 6.8-13A6.8 6.8 0 0 0 12 3.2v8.15l4.73 2.72C15.65 17.02 13.4 20.46 12 23Z" /><path fill="#4285f4" d="M5.2 10c0 5.46 4.25 9.8 6.8 13v-8.3L7.27 12A6.77 6.77 0 0 1 5.2 10Z" /><path fill="#fbbc04" d="M12 3.2A6.8 6.8 0 0 0 5.2 10c0 .7.07 1.36.2 2l6.6-3.8V3.2Z" /><path fill="#ea4335" d="M12 3.2v5l6.6 3.8c.13-.64.2-1.3.2-2A6.8 6.8 0 0 0 12 3.2Z" /><circle cx="12" cy="10" r="2.55" fill="#fff" /></svg>;
}

function SocialLinks({ className = "", label }: { className?: string; label: string }) {
  return (
    <div className={`social-links ${className}`.trim()} role="group" aria-label={label}>
      {socialLinks.map((social) => (
        <a
          key={social.label}
          className={`social-link social-link-${social.icon}`}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${social.label} (opens in a new tab)`}
          title={social.label}
          data-sv-action="social-link"
          data-sv-label={social.icon}
        >
          <SocialIcon name={social.icon} />
        </a>
      ))}
    </div>
  );
}

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
            <a href="/#faq">FAQ</a>
            <a href="/#contact">Contact</a>
          </nav>
          <a className="phone-link" href={PHONE_LINK} data-sv-action="phone" data-sv-label="header">{PHONE_DISPLAY}</a>
        </div>
        <div className="nav-actions">
          <a className="button button-small desktop-cta" href="/contact" data-sv-action="request-service" data-sv-label="header">Request Service</a>
          {/* <SocialLinks className="header-socials" label="Revive Co social media and location links" /> */}
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
          <a href="/#faq" onClick={close}>FAQ</a>
          <a href="/#contact" onClick={close}>Contact</a>
          <a href={PHONE_LINK} onClick={close}>Call {PHONE_DISPLAY}</a>
          <a href="/contact" onClick={close}>Request Service</a>
          <SocialLinks className="mobile-socials" label="Revive Co social media and location links" />
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
            <a href="/#faq">FAQ</a>
            <a href="/#contact">Contact</a>
            <a href="/admin">Admin Portal</a>
          </nav>
        </div>
        <div>
          <h3>Get Started</h3>
          <p>Contact us today to get started!</p>
          <a className="button button-light" href="/contact" data-sv-action="request-service" data-sv-label="footer">Request a Cleaning</a>
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
          <SocialLinks className="footer-socials" label="Revive Co social media and location links" />
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
