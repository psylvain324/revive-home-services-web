import { BookingKoalaEmbed } from "./BookingKoalaEmbed";
import { SiteIcon, type SiteIconName } from "./SiteIcon";
import { PageShell, PHONE_DISPLAY, PHONE_LINK } from "./SiteChrome";

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
  ["How Does Online Booking Work?", "Choose a service, enter your property details, review current pricing and availability, then complete the contact and payment steps shown in the secure booking form."],
  ["Can I Book Recurring Service?", "Yes. Available frequencies are shown inside the booking form so you can choose the plan that fits your home or business."],
  ["Can I Manage My Appointment Online?", "Yes. Sign in to your customer account to review upcoming and past appointments and manage the account options Revive has enabled."],
  ["What If My Project Needs a Custom Quote?", "Use the contact form for commercial, post-construction, move, or other custom work that needs a conversation before booking."],
  ["Where Is My Payment Information Stored?", "Card information is handled by the payment processor connected to BookingKoala. Revive's website does not receive or store your full card number."],
  ["What If I Need Help?", `Use the contact form or call ${PHONE_DISPLAY}. For an existing booking, signing in first helps you review the appointment details.`],
];

function App() {
  return (
    <PageShell>
      <main id="main">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <img className="hero-image" src="/images/revive-co-hero.jpg" srcSet="/images/revive-co-hero-768.jpg 768w, /images/revive-co-hero.jpg 2048w" sizes="100vw" alt="A bright, freshly cleaned living room" width="2048" height="896" fetchPriority="high" />
          <div className="hero-wash" />
          <div className="container hero-content">
            <p className="eyebrow">Residential &amp; Commercial Cleaning</p>
            <h1 id="hero-title">Revive Your Space.<br /><em>Reclaim Your Time.</em></h1>
            <p>Thoughtful, professional cleaning for homes, businesses, move-outs, and post-construction spaces. View services, see availability, and book securely online.</p>
            <div className="hero-actions">
              <a className="button" href="/book" data-sv-action="book-service" data-sv-label="hero">Book Online</a>
              <a className="text-link" href={PHONE_LINK} data-sv-action="phone" data-sv-label="hero">Call {PHONE_DISPLAY} <span aria-hidden="true">↗</span></a>
            </div>
            <div className="trust-strip" aria-label="Service assurances">
              <span>Licensed, Bonded &amp; Insured</span>
              <span>Professional Cleaning Team</span>
              <span>Personal, Reliable Follow-Through</span>
            </div>
          </div>
        </section>

        <section className="booking-band" aria-label="Online booking steps">
          <div className="container booking-band-grid">
            <div className="booking-step"><span className="booking-step-icon"><SiteIcon name="broom" /></span><div><strong>01</strong><span>Choose Your Clean</span><small>Service, Property Details &amp; Extras</small></div></div>
            <div className="booking-step"><span className="booking-step-icon"><SiteIcon name="message" /></span><div><strong>02</strong><span>Pick Your Time</span><small>Live Availability &amp; Clear Pricing</small></div></div>
            <div className="booking-step"><span className="booking-step-icon"><SiteIcon name="key" /></span><div><strong>03</strong><span>Complete Booking</span><small>Secure Details &amp; Confirmation</small></div></div>
            <a href="/book" className="button button-light" data-sv-action="book-service" data-sv-label="booking-band">Book Now</a>
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
                    <a className="card-link" href="/book" data-sv-action="book-service" data-sv-label={service.id}>Book This Service <span aria-hidden="true">→</span></a>
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
                <div><span>01</span><strong>Simple Online Booking</strong><p>See the choices you need in one guided, mobile-friendly form.</p></div>
                <div><span>02</span><strong>Built Around Your Space</strong><p>Select the service, frequency, extras, and property details that matter.</p></div>
                <div><span>03</span><strong>Clear Before You Submit</strong><p>Review available times, pricing, and booking details before finishing.</p></div>
                <div><span>04</span><strong>Manage It Online</strong><p>Use your customer account to keep appointment details close at hand.</p></div>
              </div>
              <a className="button" href="/book" data-sv-action="book-service" data-sv-label="why">Book Your Cleaning</a>
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
            <a className="text-link" href="/book">Book a Service <span aria-hidden="true">→</span></a>
          </div>
        </section>

        <section className="reviews-section" id="reviews" aria-labelledby="reviews-title">
          <div className="container">
            <div className="section-intro section-intro-centered">
              <p className="eyebrow">Live Customer Feedback</p>
              <h2 id="reviews-title">Hear From Revive Customers.</h2>
              <p>Reviews shown here are collected through completed BookingKoala appointments.</p>
            </div>
            <BookingKoalaEmbed kind="reviews" deferUntilVisible />
            <p className="reviews-empty-note">New feedback appears here after it is published to Revive&apos;s live review feed.</p>
          </div>
        </section>

        <section className="faq-section" id="faq" aria-labelledby="faq-title">
          <div className="container faq-grid">
            <div className="faq-heading">
              <p className="eyebrow">Helpful Details</p>
              <h2 id="faq-title">Good Questions. Clear Answers.</h2>
              <p>Need something specific? Book online, send a message, or call and the team will help you plan the right service.</p>
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
              <p className="eyebrow">Need a Hand?</p>
              <h2 id="contact-title">We&apos;re Here to Help.</h2>
              <p>Questions, commercial properties, construction cleanup, and unique projects are welcome. Choose the best way to reach Revive.</p>
              <div className="contact-callout">
                <span>Prefer to Talk?</span>
                <a href={PHONE_LINK} data-sv-action="phone" data-sv-label="contact">{PHONE_DISPLAY}</a>
              </div>
            </div>
            <div className="contact-options" aria-label="Revive Co customer options">
              <article>
                <span aria-hidden="true"><SiteIcon name="message" /></span>
                <div><h3>Send a Message</h3><p>Use the secure contact form for questions, custom work, or help with an appointment.</p></div>
                <a className="button" href="/contact" data-sv-action="contact-form" data-sv-label="home-contact-card">Contact Revive</a>
              </article>
              <article>
                <span aria-hidden="true"><SiteIcon name="key" /></span>
                <div><h3>Manage a Booking</h3><p>Sign in to review upcoming and past appointments and your customer information.</p></div>
                <a className="button button-ghost" href="/login">Customer Login</a>
              </article>
            </div>
          </div>
        </section>
      </main>
      <div className="mobile-actions" aria-label="Quick actions">
        <a href={PHONE_LINK} data-sv-action="phone" data-sv-label="mobile">Call</a>
        <a href="/book" data-sv-action="book-service" data-sv-label="mobile">Book Now</a>
      </div>
    </PageShell>
  );
}

export default App;
