import { useEffect, useState, type FormEvent } from "react";
import { api } from "./api";
import { PageShell, PHONE_DISPLAY, PHONE_LINK } from "./SiteChrome";
import { getSalesVisionAttribution, initializeSalesVision, trackSalesVisionEvent } from "./salesVision";

const services = [
  {
    id: "standard-cleaning",
    number: "01",
    name: "Residential cleaning",
    eyebrow: "A reliable everyday reset",
    description: "One-time and recurring care tailored around the rooms, priorities, and rhythm of your home.",
    image: "/images/revive-co-hero.jpg",
    alt: "Bright, professionally cleaned living room",
    bullets: ["Kitchens & bathrooms", "Living & sleeping areas", "Weekly, biweekly or custom"],
  },
  {
    id: "commercial-cleaning",
    number: "02",
    name: "Commercial cleaning",
    eyebrow: "Make a polished first impression",
    description: "Consistent cleaning plans for offices, storefronts, shared spaces, and other professional environments.",
    image: "/images/commercial-cleaning.jpg",
    alt: "Professional cleaner wiping a glass table in an office",
    bullets: ["Office & common areas", "Restrooms & break rooms", "Flexible service schedules"],
  },
  {
    id: "move-cleaning",
    number: "03",
    name: "Move-in / move-out",
    eyebrow: "Start fresh or leave it spotless",
    description: "A detail-forward clean for empty properties, renters, homeowners, property managers, and real estate teams.",
    image: "/images/move-out-cleaning.jpg",
    alt: "Cleaners caring for an empty home with hardwood floors",
    bullets: ["Empty-home detailing", "Cabinets & appliances", "Rental turnover support"],
  },
  {
    id: "post-construction-cleaning",
    number: "04",
    name: "Post-construction",
    eyebrow: "From jobsite to move-in ready",
    description: "Targeted removal of dust, residue, and construction debris after a renovation, build, or refresh.",
    image: "/images/construction-cleaning.png",
    alt: "Professional post-construction cleanup in progress",
    bullets: ["Fine-dust removal", "Surface & fixture detail", "Residential or commercial"],
  },
];

const faqs = [
  ["How does online booking work?", "Choose your service and property details, then select an available time from Revive’s live schedule. Your appointment is held once the request—and any required payment—is completed."],
  ["Can I request recurring service?", "Yes. You can request weekly, biweekly, monthly, or one-time service. Revive will confirm the scope and recurring schedule with you."],
  ["Do I need to be at the property?", "Not always. Share access instructions during booking and the team will confirm the plan before your appointment. Never place sensitive access codes in the public contact form."],
  ["What if my service needs a custom quote?", "Commercial, post-construction, and unusually detailed projects may need a quick follow-up before the price is finalized. You can still reserve your preferred time and submit the details online."],
  ["Can I pay online?", "When online payments are enabled, secure checkout supports major credit and debit cards plus eligible Apple Pay and Google Pay wallets through Stripe. Revive never stores your full card number."],
  ["Can I reschedule or cancel?", `Call ${PHONE_DISPLAY} as soon as possible. The team will confirm any timing, deposit, or cancellation terms that apply to your appointment.`],
];

function App() {
  const [contactStatus, setContactStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [contactMessage, setContactMessage] = useState("");

  useEffect(() => initializeSalesVision(), []);

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setContactStatus("sending");
    setContactMessage("");
    try {
      const response = await api.post<{ message: string }>("/api/inquiries", {
        ...data,
        attribution: getSalesVisionAttribution(),
      });
      setContactStatus("sent");
      setContactMessage(response.message);
      form.reset();
      trackSalesVisionEvent("inquiry_submitted", { category: "lead" });
    } catch (error) {
      setContactStatus("error");
      setContactMessage(error instanceof Error ? error.message : "We could not send your message. Please call us instead.");
    }
  };

  return (
    <PageShell>
      <main id="main">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <img className="hero-image" src="/images/revive-co-hero.jpg" alt="A bright, freshly cleaned living room" />
          <div className="hero-wash" />
          <div className="container hero-content">
            <p className="eyebrow">Residential &amp; commercial cleaning</p>
            <h1 id="hero-title">Revive your space.<br /><em>Reclaim your time.</em></h1>
            <p>Thoughtful, professional cleaning for homes, businesses, move-outs, and post-construction spaces—with real online scheduling.</p>
            <div className="hero-actions">
              <a className="button" href="/book" data-sv-action="book" data-sv-label="hero">See available times</a>
              <a className="text-link" href={PHONE_LINK} data-sv-action="phone" data-sv-label="hero">Call {PHONE_DISPLAY} <span aria-hidden="true">↗</span></a>
            </div>
            <div className="trust-strip" aria-label="Service assurances">
              <span>Licensed, bonded &amp; insured</span>
              <span>Professional cleaning team</span>
              <span>Simple, reliable scheduling</span>
            </div>
          </div>
        </section>

        <section className="booking-band" aria-label="Online booking benefits">
          <div className="container booking-band-grid">
            <div><strong>01</strong><span>Choose your clean</span><small>Service, home details &amp; add-ons</small></div>
            <div><strong>02</strong><span>Pick an open time</span><small>Live availability from Revive</small></div>
            <div><strong>03</strong><span>Confirm securely</span><small>Pay online or request a quote</small></div>
            <a href="/book" className="button button-light" data-sv-action="book" data-sv-label="booking-band">Start booking</a>
          </div>
        </section>

        <section className="services-section" id="services" aria-labelledby="services-title">
          <div className="container">
            <div className="section-intro">
              <div>
                <p className="eyebrow">Cleaning for real life</p>
                <h2 id="services-title">The right clean for every kind of space.</h2>
              </div>
              <p>Choose a starting point and customize the details while booking. If your project needs a closer look, Revive can follow up with a tailored quote.</p>
            </div>
            <div className="service-grid">
              {services.map((service) => (
                <article className="service-card" key={service.id}>
                  <a className="service-image" href={`/book?service=${service.id}`} aria-label={`Book ${service.name}`}>
                    <img src={service.image} alt={service.alt} loading="lazy" />
                    <span>{service.number}</span>
                  </a>
                  <div className="service-copy">
                    <p className="service-eyebrow">{service.eyebrow}</p>
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                    <ul>{service.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                    <a className="card-link" href={`/book?service=${service.id}`} data-sv-action="book-service" data-sv-label={service.id}>Book this service <span aria-hidden="true">→</span></a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="why-section" id="why-revive" aria-labelledby="why-title">
          <div className="container why-grid">
            <div className="why-visual">
              <img className="why-photo" src="/images/commercial-cleaning.jpg" alt="Revive professional cleaning an office surface" loading="lazy" />
              <div className="insured-badge">
                <img src="/images/licensed-bonded-insured.webp" alt="Licensed, bonded and insured" loading="lazy" />
              </div>
            </div>
            <div className="why-copy">
              <p className="eyebrow">Care you can count on</p>
              <h2 id="why-title">A professional clean, without the runaround.</h2>
              <p className="lead">A great cleaning service should make life easier from the first click. Revive combines dependable scheduling, clear communication, and service plans built around the property—not a one-size-fits-all checklist.</p>
              <div className="benefit-grid">
                <div><span>01</span><strong>Reliable scheduling</strong><p>Choose from times the business has actually made available.</p></div>
                <div><span>02</span><strong>Built around your space</strong><p>Select the service, frequency, add-ons, and property details that matter.</p></div>
                <div><span>03</span><strong>Secure checkout</strong><p>Eligible card and wallet payments are handled by Stripe—not stored by Revive.</p></div>
                <div><span>04</span><strong>Human follow-through</strong><p>Questions and quote-based projects go straight to the Revive team.</p></div>
              </div>
              <a className="button" href="/book" data-sv-action="book" data-sv-label="why">Plan your cleaning</a>
            </div>
          </div>
        </section>

        <section className="process-section" id="process" aria-labelledby="process-title">
          <div className="container">
            <div className="center-heading">
              <p className="eyebrow">From busy to booked</p>
              <h2 id="process-title">Your clean is only a few steps away.</h2>
            </div>
            <ol className="process-grid">
              <li><span>1</span><div><strong>Build your service</strong><p>Tell us about the property, choose the cleaning type and add any special requests.</p></div></li>
              <li><span>2</span><div><strong>Select your time</strong><p>Pick an available appointment that fits your schedule—no back-and-forth guessing.</p></div></li>
              <li><span>3</span><div><strong>Confirm and relax</strong><p>Review your details, pay securely when available, and receive a booking confirmation.</p></div></li>
            </ol>
          </div>
        </section>

        <section className="feature-split" aria-label="Revive service promise">
          <div className="feature-image"><img src="/images/move-out-cleaning.jpg" alt="A freshly cleaned, move-in-ready home" loading="lazy" /></div>
          <div className="feature-copy">
            <p className="eyebrow">Your priorities, our plan</p>
            <h2>A clean that fits the space—and the season you’re in.</h2>
            <p>Recurring home care, a move, a business that needs dependable upkeep, or the final phase of a renovation: Revive starts with the outcome you need.</p>
            <ul className="check-list">
              <li>One-time and recurring options</li>
              <li>Residential and commercial properties</li>
              <li>Custom notes and add-on requests</li>
              <li>Online inquiries for quote-based projects</li>
            </ul>
            <a className="text-link" href="/book">Explore available services <span aria-hidden="true">→</span></a>
          </div>
        </section>

        <section className="faq-section" id="faq" aria-labelledby="faq-title">
          <div className="container faq-grid">
            <div className="faq-heading">
              <p className="eyebrow">Helpful details</p>
              <h2 id="faq-title">Good questions. Clear answers.</h2>
              <p>Need something specific? Send a note or call and the team can help before you book.</p>
              <a className="text-link" href={PHONE_LINK}>Call {PHONE_DISPLAY}</a>
            </div>
            <div className="faq-list">
              {faqs.map(([question, answer], index) => (
                <details key={question} open={index === 0}>
                  <summary>{question}<span aria-hidden="true">+</span></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="contact-section" id="contact" aria-labelledby="contact-title">
          <div className="container contact-grid">
            <div className="contact-copy">
              <p className="eyebrow">Not ready to book?</p>
              <h2 id="contact-title">Tell us what you need.</h2>
              <p>Questions, commercial properties, construction cleanup, and unique projects are welcome. Share the basics and Revive can follow up.</p>
              <div className="contact-callout">
                <span>Prefer to talk?</span>
                <a href={PHONE_LINK} data-sv-action="phone" data-sv-label="contact">{PHONE_DISPLAY}</a>
              </div>
            </div>
            <form className="contact-form" onSubmit={submitContact} aria-label="Contact Revive Co">
              <div className="form-row">
                <label>First name<input name="firstName" autoComplete="given-name" required /></label>
                <label>Last name<input name="lastName" autoComplete="family-name" required /></label>
              </div>
              <div className="form-row">
                <label>Email<input name="email" type="email" autoComplete="email" required /></label>
                <label>Phone<input name="phone" type="tel" autoComplete="tel" required /></label>
              </div>
              <label>What can we help with?
                <select name="service" defaultValue="" required>
                  <option value="" disabled>Select a service</option>
                  {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                  <option value="other">Something else</option>
                </select>
              </label>
              <label>Message<textarea name="message" rows={5} required placeholder="Property type, approximate size, preferred timing, and anything else we should know." /></label>
              <label className="consent-row"><input name="consent" type="checkbox" required /><span>I agree that Revive Co may contact me about this request. Message and data rates may apply.</span></label>
              <button className="button" type="submit" disabled={contactStatus === "sending"}>{contactStatus === "sending" ? "Sending…" : "Send inquiry"}</button>
              <p className={`form-status ${contactStatus}`} role="status">{contactMessage}</p>
            </form>
          </div>
        </section>
      </main>
      <div className="mobile-actions" aria-label="Quick actions">
        <a href={PHONE_LINK} data-sv-action="phone" data-sv-label="mobile">Call</a>
        <a href="/book" data-sv-action="book" data-sv-label="mobile">Book now</a>
      </div>
    </PageShell>
  );
}

export default App;
