import { PageShell } from "./SiteChrome";

export default function NotFoundPage() {
  return (
    <PageShell compactHeader>
      <main id="main" className="legacy-status-page">
        <section className="legacy-status-section">
          <div className="container">
            <article className="legacy-status-card">
              <p className="eyebrow">404 · Page Not Found</p>
              <h1>That Page Has Moved.</h1>
              <p>The address may be outdated or mistyped. Return to Revive Co&apos;s website or open the current booking form.</p>
              <div className="legacy-status-actions">
                <a className="button" href="/">Return Home</a>
                <a className="button button-ghost" href="/book">Book a Cleaning</a>
              </div>
            </article>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
