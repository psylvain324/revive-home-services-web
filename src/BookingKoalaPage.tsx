import { BookingKoalaEmbed, type BookingKoalaEmbedKind } from "./BookingKoalaEmbed";
import { PageShell, PHONE_DISPLAY, PHONE_LINK } from "./SiteChrome";

const pageContent: Record<BookingKoalaEmbedKind, { eyebrow: string; heading: string; intro: string }> = {
  book: {
    eyebrow: "Secure Online Booking",
    heading: "Book Your Cleaning.",
    intro: "Choose your service, see current pricing and availability, and complete your booking through Revive Co's secure BookingKoala form.",
  },
  login: {
    eyebrow: "Customer Account",
    heading: "Welcome Back.",
    intro: "Sign in to view and manage your Revive Co appointments, account details, billing information, and service history.",
  },
  signup: {
    eyebrow: "New Customer",
    heading: "Create Your Account.",
    intro: "Create a secure Revive Co customer account to book services and manage future appointments in one place.",
  },
  contact: {
    eyebrow: "Contact Revive Co",
    heading: "How Can We Help?",
    intro: "Send the team a question about services, an existing appointment, a commercial property, or a custom cleaning project.",
  },
  reviews: {
    eyebrow: "Customer Feedback",
    heading: "Real Service. Real Reviews.",
    intro: "Read feedback collected from Revive Co customers after their completed services.",
  },
};

function SupportingLinks({ kind }: { kind: BookingKoalaEmbedKind }) {
  if (kind === "login") {
    return <p>New to Revive? <a href="/signup">Create an account</a> or <a href="/book">book a cleaning</a>.</p>;
  }
  if (kind === "signup") {
    return <p>Already have an account? <a href="/login">Sign in</a>.</p>;
  }
  if (kind === "book") {
    return <p>Already a customer? <a href="/login">Sign in to manage your bookings</a>.</p>;
  }
  return <p>Prefer to speak with the team? <a href={PHONE_LINK}>Call {PHONE_DISPLAY}</a>.</p>;
}

export default function BookingKoalaPage({ kind }: { kind: BookingKoalaEmbedKind }) {
  const content = pageContent[kind];

  return (
    <PageShell compactHeader>
      <main id="main" className="booking-koala-page">
        <section className="booking-koala-header" aria-labelledby="booking-koala-title">
          <div className="container booking-koala-heading">
            <div>
              <p className="eyebrow">{content.eyebrow}</p>
              <h1 id="booking-koala-title">{content.heading}</h1>
              <p>{content.intro}</p>
            </div>
            <div className="booking-koala-supporting-links">
              <SupportingLinks kind={kind} />
              <p className="secure-provider-note"><span aria-hidden="true">✓</span> Securely provided by BookingKoala</p>
            </div>
          </div>
        </section>
        <section className="booking-koala-section" aria-label={content.eyebrow}>
          <div className="container">
            <BookingKoalaEmbed kind={kind} />
          </div>
        </section>
      </main>
    </PageShell>
  );
}
