import { PageShell, PHONE_DISPLAY, PHONE_LINK } from "./SiteChrome";

export default function LegacyBookingStatusPage() {
  return (
    <PageShell compactHeader>
      <main id="main" className="legacy-status-page">
        <section className="booking-koala-header" aria-labelledby="legacy-booking-title">
          <div className="container booking-koala-heading">
            <div>
              <p className="eyebrow">Previous Website Booking</p>
              <h1 id="legacy-booking-title">Check Before Booking Again.</h1>
              <p>This return page belongs to Revive Co&apos;s retired website checkout. It does not confirm whether an earlier payment or appointment completed.</p>
            </div>
          </div>
        </section>
        <section className="legacy-status-section">
          <div className="container">
            <article className="legacy-status-card">
              <h2>Contact Revive to verify the earlier transaction.</h2>
              <p>Check your email for a receipt or booking confirmation, and keep any reference number you received. To avoid a duplicate charge or appointment, do not submit a replacement booking until the Revive team confirms the status.</p>
              <div className="legacy-status-actions">
                <a className="button" href={PHONE_LINK}>Call {PHONE_DISPLAY}</a>
                <a className="button button-ghost" href="/contact" referrerPolicy="no-referrer">Send a Message</a>
              </div>
              <p className="legal-note">For a separate, unrelated appointment, you can open the <a href="/book" referrerPolicy="no-referrer">current secure booking form</a>.</p>
            </article>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
