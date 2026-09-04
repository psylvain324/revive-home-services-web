import { useEffect, useState, type FormEvent } from "react";
import { api } from "./api";
import { PageShell, PHONE_DISPLAY, PHONE_LINK } from "./SiteChrome";
import { getSalesVisionAttribution, initializeSalesVision, trackSalesVisionEvent } from "./salesVision";

const services = [
  {
    id: "standard-cleaning",
    number: "01",
    name: "Residential Cleaning",
    eyebrow: "A Reliable Everyday Reset",
    description: "One-time and recurring care tailored around the rooms, priorities, and rhythm of your home.",
    image: "/images/revive-co-hero.jpg",
    alt: "Bright, professionally cleaned living room",
    bullets: ["Kitchens & Bathrooms", "Living & Sleeping Areas", "Weekly, Biweekly or Custom"],
  },
  {
    id: "commercial-cleaning",
    number: "02",
    name: "Commercial Cleaning",
    eyebrow: "Make a Polished First Impression",
    description: "Consistent cleaning plans for offices, storefronts, shared spaces, and other professional environments.",
    image: "/images/commercial-cleaning.jpg",
    alt: "Professional cleaner wiping a glass table in an office",
    bullets: ["Office & Common Areas", "Restrooms & Break Rooms", "Flexible Service Schedules"],
  },
  {
    id: "move-cleaning",
    number: "03",
    name: "Move-In / Move-Out",
    eyebrow: "Start Fresh or Leave It Spotless",
    description: "A detail-forward clean for empty properties, renters, homeowners, property managers, and real estate teams.",
    image: "/images/move-out-cleaning.jpg",
    alt: "Cleaners caring for an empty home with hardwood floors",
    bullets: ["Empty-Home Detailing", "Cabinets & Appliances", "Rental Turnover Support"],
  },
  {
    id: "post-construction-cleaning",
    number: "04",
    name: "Post-Construction",
    eyebrow: "From Jobsite to Move-In Ready",
    description: "Targeted removal of dust, residue, and construction debris after a renovation, build, or refresh.",
    image: "/images/construction-cleaning.png",
    alt: "Professional post-construction cleanup in progress",
    bullets: ["Fine-Dust Removal", "Surface & Fixture Detail", "Residential or Commercial"],
  },
];

const faqs = [
  ["How Does Online Booking Work?", "Choose your service and property details, then select an available time from Revive’s live schedule. Your appointment is held once the request—and any required payment—is completed."],
  ["Can I Request Recurring Service?", "Yes. You can request weekly, biweekly, monthly, or one-time service. Revive will confirm the scope and recurring schedule with you."],
  ["Do I Need to Be at the Property?", "Not always. Share access instructions during booking and the team will confirm the plan before your appointment. Never place sensitive access codes in the public contact form."],
  ["What If My Service Needs a Custom Quote?", "Commercial, post-construction, and unusually detailed projects may need a quick follow-up before the price is finalized. You can still reserve your preferred time and submit the details online."],
  ["Can I Pay Online?", "When online payments are enabled, secure checkout supports major credit and debit cards plus eligible Apple Pay and Google Pay wallets through Stripe. Revive never stores your full card number."],
  ["Can I Reschedule or Cancel?", `Call ${PHONE_DISPLAY} as soon as possible. The team will confirm any timing, deposit, or cancellation terms that apply to your appointment.`],
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
            <p className="eyebrow">Residential &amp; Commercial Cleaning</p>
            <h1 id="hero-title">Revive Your Space.<br /><em>Reclaim Your Time.</em></h1>
            <p>Thoughtful, professional cleaning for homes, businesses, move-outs, and post-construction spaces—with real online scheduling.</p>
            <div className="hero-actions">
              <a className="button" href="/book" data-sv-action="book" data-sv-label="hero">See Available Times</a>
              <a className="text-link" href={PHONE_LINK} data-sv-action="phone" data-sv-label="hero">Call {PHONE_DISPLAY} <span aria-hidden="true">↗</span></a>
            </div>
            <div className="trust-strip" aria-label="Service assurances">
              <span>Licensed, Bonded &amp; Insured</span>
              <span>Professional Cleaning Team</span>
              <span>Simple, Reliable Scheduling</span>
            </div>
          </div>
        </section>

        <section className="booking-band" aria-label="Online booking benefits">
          <div className="container booking-band-grid">
            <div><strong>01</strong><span>Choose Your Clean</span><small>Service, Home Details &amp; Add-Ons</small></div>
            <div><strong>02</strong><span>Pick an Open Time</span><small>Live Availability From Revive</small></div>
            <div><strong>03</strong><span>Confirm Securely</span><small>Pay Online or Request a Quote</small></div>
            <a href="/book" className="button button-light" data-sv-action="book" data-sv-label="booking-band">Start Booking</a>
          </div>
        </section>

        <section className="services-section" id="services" aria-labelledby="services-title">
          <div className="container">
            <div className="section-intro">
              <div>
                <p className="eyebrow">Cleaning for Real Life</p>
                <h2 id="services-title">The Right Clean for Every Kind of Space.</h2>
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
                    <a className="card-link" href={`/book?service=${service.id}`} data-sv-action="book-service" data-sv-label={service.id}>Book This Service <span aria-hidden="true">→</span></a>
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
              <p className="eyebrow">Care You Can Count On</p>
              <h2 id="why-title">A Professional Clean, Without the Runaround.</h2>
              <p className="lead">A great cleaning service should make life easier from the first click. Revive combines dependable scheduling, clear communication, and service plans built around the property—not a one-size-fits-all checklist.</p>
              <div className="benefit-grid">
                <div><span>01</span><strong>Reliable Scheduling</strong><p>Choose from times the business has actually made available.</p></div>
                <div><span>02</span><strong>Built Around Your Space</strong><p>Select the service, frequency, add-ons, and property details that matter.</p></div>
                <div><span>03</span><strong>Secure Checkout</strong><p>Eligible card and wallet payments are handled by Stripe—not stored by Revive.</p></div>
                <div><span>04</span><strong>Human Follow-Through</strong><p>Questions and quote-based projects go straight to the Revive team.</p></div>
              </div>
              <a className="button" href="/book" data-sv-action="book" data-sv-label="why">Plan Your Cleaning</a>
            </div>
          </div>
        </section>

        <section className="process-section" id="process" aria-labelledby="process-title">
          <div className="container">
            <div className="center-heading">
              <p className="eyebrow">From Busy to Booked</p>
              <h2 id="process-title">Your Clean Is Only a Few Steps Away.</h2>
            </div>
            <ol className="process-grid">
              <li><span>1</span><div><strong>Build Your Service</strong><p>Tell us about the property, choose the cleaning type and add any special requests.</p></div></li>
              <li><span>2</span><div><strong>Select Your Time</strong><p>Pick an available appointment that fits your schedule—no back-and-forth guessing.</p></div></li>
              <li><span>3</span><div><strong>Confirm and Relax</strong><p>Review your details, pay securely when available, and receive a booking confirmation.</p></div></li>
            </ol>
          </div>
        </section>

        <section className="feature-split" aria-label="Revive service promise">
          <div className="feature-image"><img src="/images/move-out-cleaning.jpg" alt="A freshly cleaned, move-in-ready home" loading="lazy" /></div>
          <div className="feature-copy">
            <p className="eyebrow">Your Priorities, Our Plan</p>
            <h2>A Clean That Fits the Space—and the Season You’re In.</h2>
            <p>Recurring home care, a move, a business that needs dependable upkeep, or the final phase of a renovation: Revive starts with the outcome you need.</p>
            <ul className="check-list">
              <li>One-Time and Recurring Options</li>
              <li>Residential and Commercial Properties</li>
              <li>Custom Notes and Add-On Requests</li>
              <li>Online Inquiries for Quote-Based Projects</li>
            </ul>
            <a className="text-link" href="/book">Explore Available Services <span aria-hidden="true">→</span></a>
          </div>
        </section>

        <section className="faq-section" id="faq" aria-labelledby="faq-title">
          <div className="container faq-grid">
            <div className="faq-heading">
              <p className="eyebrow">Helpful Details</p>
              <h2 id="faq-title">Good Questions. Clear Answers.</h2>
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
              <p className="eyebrow">Not Ready to Book?</p>
              <h2 id="contact-title">Tell Us What You Need.</h2>
              <p>Questions, commercial properties, construction cleanup, and unique projects are welcome. Share the basics and Revive can follow up.</p>
              <div className="contact-callout">
                <span>Prefer to Talk?</span>
                <a href={PHONE_LINK} data-sv-action="phone" data-sv-label="contact">{PHONE_DISPLAY}</a>
              </div>
            </div>
            <form className="contact-form" onSubmit={submitContact} aria-label="Contact Revive Co">
              <div className="form-row">
                <label>First Name<input name="firstName" autoComplete="given-name" required /></label>
                <label>Last Name<input name="lastName" autoComplete="family-name" required /></label>
              </div>
              <div className="form-row">
                <label>Email<input name="email" type="email" autoComplete="email" required /></label>
                <label>Phone<input name="phone" type="tel" autoComplete="tel" required /></label>
              </div>
              <label>What Can We Help With?
                <select name="service" defaultValue="" required>
                  <option value="" disabled>Select a Service</option>
                  {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                  <option value="other">Something Else</option>
                </select>
              </label>
              <label>Message<textarea name="message" rows={5} required placeholder="Property type, approximate size, preferred timing, and anything else we should know." /></label>
              <label className="consent-row"><input name="consent" type="checkbox" required /><span>I agree that Revive Co may contact me about this request. Message and data rates may apply.</span></label>
              <button className="button" type="submit" disabled={contactStatus === "sending"}>{contactStatus === "sending" ? "Sending…" : "Send Inquiry"}</button>
              <p className={`form-status ${contactStatus}`} role="status">{contactMessage}</p>
            </form>
          </div>
        </section>
      </main>
      <div className="mobile-actions" aria-label="Quick actions">
        <a href={PHONE_LINK} data-sv-action="phone" data-sv-label="mobile">Call</a>
        <a href="/book" data-sv-action="book" data-sv-label="mobile">Book Now</a>
      </div>
    </PageShell>
  );
}

export default App;
