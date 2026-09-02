import { useEffect, useRef, useState } from "react";

const PHONE_DISPLAY = "(952) 222-8309";
const PHONE_LINK = "tel:+19522228309";
const EMAIL = "info@revivecleanmn.com";

const services = [
  {
    name: "Carpet cleaning",
    description: "Deep, professional cleaning that lifts stains, allergens, and everyday odors while helping extend the life of your carpet.",
    image: "/images/carpet-cleaning.jpg",
    link: "https://revivecleanmn.com/carpet-cleaning/",
    tag: "Lakeville's Best",
  },
  {
    name: "Air duct cleaning",
    description: "A thorough HVAC-system clean designed to remove dust and buildup, improve airflow, and support healthier indoor air.",
    image: "/images/air-duct-cleaning.jpg",
    link: "https://revivecleanmn.com/air-duct-cleaning/",
    tag: "Whole-home care",
  },
  {
    name: "Hardwood refinishing",
    description: "Restore worn hardwood with Minnesota's only same-day UV-cured finish—so your family and pets can get back on the floor sooner.",
    image: "/images/hardwood-refinishing.jpg",
    link: "https://revivecleanmn.com/hardwood-floor-refinishing/",
    tag: "Same-day UV cure",
  },
  {
    name: "Upholstery cleaning",
    description: "Refresh sofas, chairs, sectionals, and other upholstered pieces with fabric-aware professional cleaning.",
    image: "/images/upholstery-cleaning.jpg",
    link: "https://revivecleanmn.com/upholstery-cleaning/",
    tag: "Furniture refreshed",
  },
];

const serviceAreas = [
  "Apple Valley",
  "Burnsville",
  "Chanhassen",
  "Cottage Grove",
  "Eagan",
  "Eden Prairie",
  "Elko New Market",
  "Farmington",
  "Hastings",
  "Lakeville",
  "Minneapolis",
  "Prior Lake",
  "Rosemount",
  "Savage",
];

const reviewLinks = [
  {
    name: "Google",
    href: "https://www.google.com/search?q=Revive+Carpet+and+Air+Duct+Cleaning",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/revivecarpetandairductcleaning/",
  },
  {
    name: "HomeAdvisor",
    href: "https://www.homeadvisor.com/rated.ReviveCleaningServices.124751069.html",
  },
  {
    name: "Yelp",
    href: "https://www.yelp.com/biz/revive-carpet-and-air-duct-cleaning-lakeville",
  },
];

function ExternalArrow() {
  return <span aria-hidden="true">↗</span>;
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeMenu = () => setMenuOpen(false);

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

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="site-header">
        <div className="topline">
          <div className="container topline-inner">
            <span>Locally owned · Serving the Twin Cities</span>
            <a href={PHONE_LINK}>Call {PHONE_DISPLAY}</a>
          </div>
        </div>

        <div className="container nav-row">
          <a className="brand" href="#top" aria-label="Revive Home Services home">
            <img src="/images/revive-logo.svg" alt="Revive Home Services" />
          </a>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#services">Services</a>
            <a href="#why-revive">Why Revive</a>
            <a href="#pricing">Pricing</a>
            <a href="#service-area">Service area</a>
            <a href="#contact">Contact</a>
          </nav>

          <a className="button button-small desktop-cta" href="#contact">
            Request service
          </a>

          <button
            className="menu-button"
            type="button"
            ref={menuButtonRef}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <nav
          className={`mobile-menu${menuOpen ? " is-open" : ""}`}
          id="mobile-menu"
          aria-label="Mobile navigation"
          aria-hidden={!menuOpen}
        >
          <a href="#services" onClick={closeMenu}>Services</a>
          <a href="#why-revive" onClick={closeMenu}>Why Revive</a>
          <a href="#pricing" onClick={closeMenu}>Pricing</a>
          <a href="#service-area" onClick={closeMenu}>Service area</a>
          <a href="#contact" onClick={closeMenu}>Request service</a>
        </nav>
      </header>

      <main id="main">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-shade" />
          <div className="container hero-content">
            <p className="eyebrow">Award-winning home care in Minnesota</p>
            <h1 id="hero-title">
              A cleaner home.
              <br />
              <em>A happier life.</em>
            </h1>
            <p className="hero-copy">
              Best-in-industry carpet, floor, upholstery, and air duct cleaning—delivered with honest pricing and a 100% satisfaction guarantee.
            </p>
            <div className="hero-actions">
              <a className="button" href="#contact">Request your service</a>
              <a className="text-link" href={PHONE_LINK}>
                Or call {PHONE_DISPLAY} <span aria-hidden="true">→</span>
              </a>
            </div>
            <ul className="trust-row" aria-label="Why homeowners choose Revive">
              <li><strong>5-star</strong><span>rated service</span></li>
              <li><strong>100%</strong><span>satisfaction guarantee</span></li>
              <li><strong>Local</strong><span>Twin Cities team</span></li>
            </ul>
          </div>
          <a className="scroll-cue" href="#services" aria-label="Explore our services">
            <span>Explore</span>
            <span aria-hidden="true">↓</span>
          </a>
        </section>

        <section className="services-section" id="services" aria-labelledby="services-title">
          <div className="container">
            <div className="section-intro">
              <div>
                <p className="eyebrow">Clean beyond the surface</p>
                <h2 id="services-title">Every room deserves a fresh start.</h2>
              </div>
              <p>
                Life gets messy. Revive pairs trained technicians with professional-grade equipment to help your home feel clean, healthy, and comfortable again.
              </p>
            </div>

            <div className="service-grid">
              {services.map((service, index) => (
                <article className="service-card" key={service.name}>
                  <a
                    className="service-image"
                    href={service.link}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Learn more about ${service.name}`}
                  >
                    <img src={service.image} alt="" loading={index > 1 ? "lazy" : "eager"} />
                    <span>{service.tag}</span>
                  </a>
                  <div className="service-copy">
                    <p className="service-number">0{index + 1}</p>
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                    <a href={service.link} target="_blank" rel="noreferrer">
                      Explore service <ExternalArrow />
                    </a>
                  </div>
                </article>
              ))}
            </div>

            <div className="service-more">
              <div className="service-more-copy">
                <span className="mini-icon" aria-hidden="true">+</span>
                <div>
                  <strong>Tile, grout &amp; LVP cleaning</strong>
                  <p>Cut through residue and buildup for cleaner-looking floors and brighter grout.</p>
                </div>
              </div>
              <a
                className="text-link text-link-dark"
                href="https://revivecleanmn.com/tile-and-grout-cleaning/"
                target="_blank"
                rel="noreferrer"
              >
                See tile &amp; grout cleaning <ExternalArrow />
              </a>
            </div>
          </div>
        </section>

        <section className="why-section" id="why-revive" aria-labelledby="why-title">
          <div className="container why-grid">
            <div className="why-visual">
              <div className="why-photo">
                <img src="/images/revive-van.png" alt="Revive Home Services service van" loading="lazy" />
              </div>
              <div className="award-card">
                <img src="/images/lakeville-best.svg" alt="Voted Lakeville's Best Carpet Cleaning Company" loading="lazy" />
              </div>
            </div>

            <div className="why-copy">
              <p className="eyebrow">Results, not gimmicks</p>
              <h2 id="why-title">Family values meet best-in-class quality.</h2>
              <p className="lead">
                Carpet and upholstery are investments—but homes are meant to be lived in. Revive uses honest pricing and proven methods to take on the mess without the bait and switch.
              </p>
              <ul className="benefit-list">
                <li>
                  <span>01</span>
                  <div><strong>Trained, detail-minded technicians</strong><p>Knowledgeable care for carpet, tile, upholstery, hardwood, and ductwork.</p></div>
                </li>
                <li>
                  <span>02</span>
                  <div><strong>Clear, fair pricing</strong><p>Know the published starting prices before you book, with needs explained upfront.</p></div>
                </li>
                <li>
                  <span>03</span>
                  <div><strong>A 100% satisfaction guarantee</strong><p>If something is amiss after a cleaning, the team is committed to making it right.</p></div>
                </li>
              </ul>
              <a className="button button-dark" href="#contact">Talk with Revive</a>
            </div>
          </div>
        </section>

        <section className="process-section" aria-labelledby="process-title">
          <div className="container">
            <div className="centered-heading">
              <p className="eyebrow">Simple from start to finish</p>
              <h2 id="process-title">Fresh feels closer than you think.</h2>
            </div>
            <ol className="process-grid">
              <li><span>1</span><strong>Tell us what needs care</strong><p>Send a quick request or call the team with your rooms, surfaces, and concerns.</p></li>
              <li><span>2</span><strong>Confirm your service</strong><p>Revive helps match your home with the right method, pricing, and appointment.</p></li>
              <li><span>3</span><strong>Enjoy the reset</strong><p>A trained technician completes the work and makes sure you are happy with the result.</p></li>
            </ol>
          </div>
        </section>

        <section className="pricing-section" id="pricing" aria-labelledby="pricing-title">
          <div className="container pricing-grid">
            <div className="pricing-heading">
              <p className="eyebrow">Straightforward starting prices</p>
              <h2 id="pricing-title">Good care should not come with a guessing game.</h2>
              <p>These published prices make it easier to plan. Final pricing depends on the scope and condition of your home.</p>
              <a
                className="text-link text-link-dark"
                href="https://revivecleanmn.com/pricing/"
                target="_blank"
                rel="noreferrer"
              >
                View complete pricing &amp; promotions <ExternalArrow />
              </a>
            </div>
            <div className="price-list">
              <a href="#contact"><span><strong>3-room carpet special</strong><small>Up to 200 sq. ft. per room</small></span><b>$159</b></a>
              <a href="#contact"><span><strong>Air duct cleaning</strong><small>Up to 16 vents / openings</small></span><b>$400</b></a>
              <a href="#contact"><span><strong>3-seat couch</strong><small>Professional upholstery cleaning</small></span><b>$149</b></a>
              <a href="#contact"><span><strong>Hardwood clean &amp; polish</strong><small>Price per square foot</small></span><b>$1.50</b></a>
            </div>
          </div>
        </section>

        <section className="reviews-section" aria-labelledby="reviews-title">
          <div className="container reviews-inner">
            <div>
              <p className="eyebrow">Trusted around the Twin Cities</p>
              <h2 id="reviews-title">Do not just take our word for it.</h2>
            </div>
            <div className="rating-card" aria-label="Five star ratings">
              <div className="stars" aria-label="5 out of 5 stars">★★★★★</div>
              <strong>5-star service across the platforms homeowners trust.</strong>
              <div className="review-links">
                {reviewLinks.map((review) => (
                  <a key={review.name} href={review.href} target="_blank" rel="noreferrer">
                    {review.name} <ExternalArrow />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="area-section" id="service-area" aria-labelledby="area-title">
          <div className="container area-grid">
            <div>
              <p className="eyebrow">Proudly serving Minnesota</p>
              <h2 id="area-title">Local service across the Twin Cities metro.</h2>
              <p>Do not see your city? Call the team—nearby communities may also be available.</p>
              <a className="text-link text-link-dark" href={PHONE_LINK}>Check availability: {PHONE_DISPLAY}</a>
            </div>
            <ul className="area-list" aria-label="Primary service cities">
              {serviceAreas.map((area) => <li key={area}>{area}<span aria-hidden="true">•</span></li>)}
            </ul>
          </div>
        </section>

        <section className="contact-section" id="contact" aria-labelledby="contact-title">
          <div className="container contact-grid">
            <div className="contact-intro">
              <p className="eyebrow">Ready for a fresh start?</p>
              <h2 id="contact-title">Tell us what your home needs.</h2>
              <p>Share a few details and the Revive team can follow up about the right service for your space.</p>
              <div className="contact-direct">
                <a href={PHONE_LINK}><span>Call</span><strong>{PHONE_DISPLAY}</strong></a>
                <a href={`mailto:${EMAIL}`}><span>Email</span><strong>{EMAIL}</strong></a>
                <div><span>Hours</span><strong>Monday–Friday, 8 a.m.–6 p.m.</strong></div>
              </div>
              <img src="/images/revive-logo-stacked.svg" alt="" aria-hidden="true" className="contact-mark" />
            </div>

            <form
              className="contact-form"
              name="service-request"
              method="POST"
              action="/thank-you.html"
              data-netlify="true"
              data-netlify-honeypot="bot-field"
            >
              <input type="hidden" name="form-name" value="service-request" />
              <p className="honeypot" aria-hidden="true">
                <label>Do not fill this out if you are human: <input name="bot-field" tabIndex={-1} autoComplete="off" /></label>
              </p>
              <div className="form-row">
                <label>First name<input name="first-name" type="text" autoComplete="given-name" required /></label>
                <label>Last name<input name="last-name" type="text" autoComplete="family-name" required /></label>
              </div>
              <div className="form-row">
                <label>Email<input name="email" type="email" autoComplete="email" required /></label>
                <label>Phone<input name="phone" type="tel" autoComplete="tel" required /></label>
              </div>
              <label>Property address<input name="property-address" type="text" autoComplete="street-address" required /></label>
              <label>
                Service needed
                <select name="request-type" defaultValue="" required>
                  <option value="" disabled>Select a service</option>
                  <option>Carpet cleaning</option>
                  <option>Air duct or dryer vent cleaning</option>
                  <option>Hardwood refinishing or care</option>
                  <option>Upholstery cleaning</option>
                  <option>Tile, grout, or LVP cleaning</option>
                  <option>Multiple services / not sure</option>
                </select>
              </label>
              <label>Anything else we should know?<textarea name="details" rows={4} /></label>
              <label className="consent-row">
                <input name="contact-consent" type="checkbox" value="yes" required />
                <span>
                  I agree that Revive may contact me about this request. See the{" "}
                  <a href="https://revivecleanmn.com/privacy-policy/" target="_blank" rel="noreferrer">privacy policy</a>.
                </span>
              </label>
              <button className="button button-submit" type="submit">Send my request</button>
              <p className="form-note">For urgent scheduling questions, call <a href={PHONE_LINK}>{PHONE_DISPLAY}</a>.</p>
            </form>
          </div>
        </section>

        <section className="faq-section" aria-labelledby="faq-title">
          <div className="container faq-grid">
            <div>
              <p className="eyebrow">Good to know</p>
              <h2 id="faq-title">A few quick answers.</h2>
            </div>
            <div className="faq-list">
              <details><summary>What services does Revive offer?</summary><p>Revive provides carpet, upholstery, tile, grout, and LVP cleaning; air duct and dryer vent cleaning; and hardwood floor care, refinishing, and installation.</p></details>
              <details><summary>What area does Revive serve?</summary><p>The team serves the greater Twin Cities metro, including Lakeville, Minneapolis, Apple Valley, Eagan, Burnsville, Eden Prairie, Rosemount, Savage, and surrounding communities.</p></details>
              <details><summary>Is the work guaranteed?</summary><p>Yes. Every cleaning service is backed by Revive&apos;s 100% satisfaction guarantee.</p></details>
              <details><summary>Can I request multiple services?</summary><p>Yes. Choose “Multiple services / not sure” in the request form and describe what you would like cleaned.</p></details>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img src="/images/revive-logo-stacked.svg" alt="Revive Home Services" />
            <p>Helping Twin Cities families live clean and live happy with honest, best-in-industry home care.</p>
            <div className="social-links" aria-label="Social media">
              <a href="https://www.facebook.com/revivecarpetandairductcleaning/" target="_blank" rel="noreferrer" aria-label="Revive on Facebook">fb</a>
              <a href="https://www.instagram.com/revivecleanmn/" target="_blank" rel="noreferrer" aria-label="Revive on Instagram">ig</a>
              <a href="https://www.youtube.com/@ReviveCarpetAirDuctCleaning" target="_blank" rel="noreferrer" aria-label="Revive on YouTube">yt</a>
            </div>
          </div>

          <div>
            <h3>Explore</h3>
            <nav aria-label="Footer navigation">
              <a href="#services">Services</a>
              <a href="#why-revive">Why Revive</a>
              <a href="#pricing">Pricing</a>
              <a href="#service-area">Service area</a>
              <a href="#contact">Contact</a>
            </nav>
          </div>

          <div>
            <h3>Services</h3>
            <nav aria-label="Footer services">
              {services.map((service) => (
                <a key={service.name} href={service.link} target="_blank" rel="noreferrer">{service.name}</a>
              ))}
              <a href="https://revivecleanmn.com/tile-and-grout-cleaning/" target="_blank" rel="noreferrer">Tile &amp; grout cleaning</a>
            </nav>
          </div>

          <div>
            <h3>Contact</h3>
            <address>
              <a href={PHONE_LINK}>{PHONE_DISPLAY}</a>
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              <span>Twin Cities metro, Minnesota</span>
              <span>Mon–Fri · 8 a.m.–6 p.m.</span>
            </address>
          </div>
        </div>

        <div className="container footer-bottom">
          <div>
            <span>© {new Date().getFullYear()} Revive Home Services. All rights reserved.</span>
            <a href="https://revivecleanmn.com/privacy-policy/" target="_blank" rel="noreferrer">Privacy</a>
          </div>
          <p className="creator-credit">
            Website created by <span>Phillip Sylvain</span> at{" "}
            <a href="https://salesvisionconsulting.com" target="_blank" rel="noreferrer">Sales Vision Consulting</a>
          </p>
        </div>
      </footer>

      <div className="mobile-actions" aria-label="Quick contact options">
        <a href={PHONE_LINK}>Call now</a>
        <a href="#contact">Request service</a>
      </div>
    </div>
  );
}

export default App;
