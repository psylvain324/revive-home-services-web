import { useEffect, useState, type FormEvent } from "react";
import { api } from "./api";
import { SiteIcon, type SiteIconName } from "./SiteIcon";
import { PageShell, PHONE_DISPLAY, PHONE_LINK } from "./SiteChrome";
import { getSalesVisionAttribution, initializeSalesVision, trackSalesVisionEvent } from "./salesVision";

const services = [
  {
    id: "standard-cleaning",
    icon: "home" as SiteIconName,
    number: "01",
    name: "Residential Cleaning",
    eyebrow: "A Reliable Everyday Reset",
    description: "Flexible one-time or recurring care built around your home's priorities.",
    image: "/images/revive-co-hero.jpg",
    smallImage: "/images/revive-co-hero-768.jpg",
    width: 2048,
    height: 896,
    alt: "Bright, professionally cleaned living room",
    bullets: ["Kitchens & Bathrooms", "Living & Sleeping Areas", "Weekly, Biweekly or Custom"],
  },
  {
    id: "commercial-cleaning",
    icon: "building" as SiteIconName,
    number: "02",
    name: "Commercial Cleaning",
    eyebrow: "Make a Polished First Impression",
    description: "Reliable cleaning plans for offices, storefronts, and shared workspaces.",
    image: "/images/commercial-cleaning.jpg",
    smallImage: "/images/commercial-cleaning-768.jpg",
    width: 2048,
    height: 1152,
    alt: "Professional cleaner wiping a glass table in an office",
    bullets: ["Office & Common Areas", "Restrooms & Break Rooms", "Flexible Service Schedules"],
  },
  {
    id: "move-cleaning",
    icon: "key" as SiteIconName,
    number: "03",
    name: "Move-In / Move-Out",
    eyebrow: "Start Fresh or Leave It Spotless",
    description: "Detail-focused cleaning for empty homes, turnovers, and property handoffs.",
    image: "/images/move-out-cleaning.jpg",
    smallImage: "/images/move-out-cleaning-768.jpg",
    width: 2048,
    height: 1152,
    alt: "Cleaners caring for an empty home with hardwood floors",
    bullets: ["Empty-Home Detailing", "Cabinets & Appliances", "Rental Turnover Support"],
  },
  {
    id: "post-construction-cleaning",
    icon: "sparkles" as SiteIconName,
    number: "04",
    name: "Post-Construction",
    eyebrow: "From Jobsite to Move-In Ready",
    description: "Fine-dust and residue cleanup after renovations and new builds.",
    image: "/images/construction-cleaning.jpg",
    smallImage: "/images/construction-cleaning-768.jpg",
    width: 1152,
    height: 922,
    alt: "Professional post-construction cleanup in progress",
    bullets: ["Fine-Dust Removal", "Surface & Fixture Detail", "Residential or Commercial"],
  },
];

const faqs = [
  ["How Does the Online Request Work?", "Choose the service, share a few details about the property, and send your contact information. Revive will review the request and follow up personally to discuss scope, pricing, and availability."],
  ["Does Submitting the Form Schedule an Appointment?", "No. The online form is a contact request only. An appointment is not scheduled until Revive speaks with you and confirms the details."],
  ["Can I Request Recurring Service?", "Yes. You can request weekly, biweekly, monthly, one-time, or custom service. Revive will confirm the right plan and schedule with you."],
  ["What If My Service Needs a Custom Quote?", "That is welcome. Commercial, post-construction, move, and detailed residential projects can all be described in the request form so Revive can follow up with the right questions."],
  ["Should I Include Access Instructions?", "Share general property details, but never place alarm codes, lock codes, or other sensitive access information in the online form. Arrange those details directly with Revive."],
  ["How Will Revive Contact Me?", `The team will use the email address or phone number you provide. You can also call ${PHONE_DISPLAY} if you prefer to speak with someone directly.`],
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
          <img className="hero-image" src="/images/revive-co-hero.jpg" srcSet="/images/revive-co-hero-768.jpg 768w, /images/revive-co-hero.jpg 2048w" sizes="100vw" alt="A bright, freshly cleaned living room" width="2048" height="896" fetchPriority="high" />
          <div className="hero-wash" />
          <div className="container hero-content">
            <p className="eyebrow">Residential &amp; Commercial Cleaning</p>
            <h1 id="hero-title">Revive Your Space.<br /><em>Reclaim Your Time.</em></h1>
            <p>Thoughtful, professional cleaning for homes, businesses, move-outs, and post-construction spaces. Send a service request and the Revive team will follow up personally.</p>
            <div className="hero-actions">
              <a className="button" href="/contact" data-sv-action="request-service" data-sv-label="hero">Request Service</a>
              <a className="text-link" href={PHONE_LINK} data-sv-action="phone" data-sv-label="hero">Call {PHONE_DISPLAY} <span aria-hidden="true">↗</span></a>
            </div>
            <div className="trust-strip" aria-label="Service assurances">
              <span>Licensed, Bonded &amp; Insured</span>
              <span>Professional Cleaning Team</span>
              <span>Personal, Reliable Follow-Through</span>
            </div>
          </div>
        </section>

        <section className="booking-band" aria-label="Online service request steps">
          <div className="container booking-band-grid">
            <div className="booking-step"><span className="booking-step-icon"><SiteIcon name="broom" /></span><div><strong>01</strong><span>Choose Your Clean</span><small>Service, Home Details &amp; Add-Ons</small></div></div>
            <div className="booking-step"><span className="booking-step-icon"><SiteIcon name="message" /></span><div><strong>02</strong><span>Share Your Request</span><small>Priorities, Questions &amp; Preferred Timing</small></div></div>
            <div className="booking-step"><span className="booking-step-icon"><SiteIcon name="phone" /></span><div><strong>03</strong><span>Hear From Revive</span><small>Scope, Pricing &amp; Availability Follow-Up</small></div></div>
            <a href="/contact" className="button button-light" data-sv-action="request-service" data-sv-label="request-band">Start a Request</a>
          </div>
        </section>

        <section className="services-section" id="services" aria-labelledby="services-title">
          <div className="container">
            <div className="section-intro section-intro-centered">
              <p className="eyebrow">Cleaning for Real Life</p>
              <h2 id="services-title">The Right Clean for Every Kind of Space.</h2>
            </div>
            <div className="service-grid">
              {services.map((service) => (
                <article className="service-card" key={service.id}>
                  <div className="service-image">
                    <img src={service.image} srcSet={`${service.smallImage} 768w, ${service.image} ${service.width}w`} sizes="(max-width: 1100px) calc(100vw - 48px), 300px" alt={service.alt} width={service.width} height={service.height} loading="lazy" decoding="async" />
                    <span aria-hidden="true">{service.number}</span>
                  </div>
                  <div className="service-copy">
                    <p className="service-eyebrow"><SiteIcon name={service.icon} />{service.eyebrow}</p>
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                    <ul>{service.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                    <a className="card-link" href={`/contact?service=${service.id}`} data-sv-action="request-service" data-sv-label={service.id}>Request This Service <span aria-hidden="true">→</span></a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="why-section" id="why-revive" aria-labelledby="why-title">
          <div className="container why-grid">
            <div className="why-visual">
              <img className="why-photo" src="/images/commercial-cleaning.jpg" srcSet="/images/commercial-cleaning-768.jpg 768w, /images/commercial-cleaning.jpg 2048w" sizes="(max-width: 860px) calc(100vw - 34px), 520px" alt="Revive professional cleaning an office surface" width="2048" height="1152" loading="lazy" decoding="async" />
              <div className="insured-badge">
                <img src="/images/licensed-bonded-insured.webp" alt="Licensed, bonded and insured" width="478" height="478" loading="lazy" decoding="async" />
              </div>
            </div>
            <div className="why-copy">
              <p className="eyebrow">Care You Can Count On</p>
              <h2 id="why-title">A Professional Clean, Without the Runaround.</h2>
              <p className="lead">A great cleaning service should make life easier from the first click. Revive combines clear communication, thoughtful follow-through, and service plans built around the property—not a one-size-fits-all checklist.</p>
              <div className="benefit-grid">
                <div><span>01</span><strong>Easy Service Requests</strong><p>Share the essentials online without committing to an appointment.</p></div>
                <div><span>02</span><strong>Built Around Your Space</strong><p>Select the service, frequency, add-ons, and property details that matter.</p></div>
                <div><span>03</span><strong>No Online Commitment</strong><p>Submitting a request does not schedule service or collect payment.</p></div>
                <div><span>04</span><strong>Human Follow-Through</strong><p>Your request goes to the Revive team for a personal response.</p></div>
              </div>
              <a className="button" href="/contact" data-sv-action="request-service" data-sv-label="why">Tell Us What You Need</a>
            </div>
          </div>
        </section>

        <section className="feature-split" aria-label="Revive service promise">
          <div className="feature-image"><img src="/images/move-out-cleaning.jpg" srcSet="/images/move-out-cleaning-768.jpg 768w, /images/move-out-cleaning.jpg 2048w" sizes="(max-width: 860px) 100vw, 50vw" alt="A freshly cleaned, move-in-ready home" width="2048" height="1152" loading="lazy" decoding="async" /></div>
          <div className="feature-copy">
            <p className="eyebrow">Your Priorities, Our Plan</p>
            <h2>The Right Cleaning for Whatever Reason, in Whatever Season</h2>
            <p>Recurring Home maintenance, a move or home listing, a one off deep clean, a business that needs dependable upkeep, or the final phase of a renovation - Revive fits the job for whatever you need.</p>
            <ul className="check-list">
              <li>One-Time and Recurring Options</li>
              <li>Residential and Commercial Properties</li>
              <li>Custom Projects and Add-On Requests</li>
              <li>Comprehensive and Transparent Pricing</li>
              <li>High Quality Work at an Affordable Price</li>
            </ul>
            <a className="text-link" href="/contact">Request a Service <span aria-hidden="true">→</span></a>
          </div>
        </section>

        <section className="faq-section" id="faq" aria-labelledby="faq-title">
          <div className="container faq-grid">
            <div className="faq-heading">
              <p className="eyebrow">Helpful Details</p>
              <h2 id="faq-title">Good Questions. Clear Answers.</h2>
              <p>Need something specific? Send a request or call and the team will help you plan the right service.</p>
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
              <p className="eyebrow">Have a Question?</p>
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
        <a href="/contact" data-sv-action="request-service" data-sv-label="mobile">Request Service</a>
      </div>
    </PageShell>
  );
}

export default App;
