import { useEffect, useState } from "react";
import { api, formatMoney } from "./api";
import { PageShell, PHONE_DISPLAY, PHONE_LINK } from "./SiteChrome";
import { initializeSalesVision, trackSalesVisionEvent } from "./salesVision";

type PaymentResult = {
  confirmationCode: string;
  customerName: string;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  paymentStatus: string;
  totalCents: number;
};

export default function BookingSuccessPage() {
  const sessionId = new URLSearchParams(window.location.search).get("session_id");
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState(sessionId ? "" : "The payment confirmation link is incomplete.");

  useEffect(() => {
    const cleanup = initializeSalesVision();
    if (!sessionId) return cleanup;
    api.get<PaymentResult>(`/api/payment-status?session_id=${encodeURIComponent(sessionId)}`)
      .then((data) => {
        setResult(data);
        trackSalesVisionEvent("purchase", { category: "booking", value: data.totalCents });
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "We could not load the payment confirmation."));
    return cleanup;
  }, [sessionId]);

  return (
    <PageShell compactHeader>
      <main id="main" className="subpage-main">
        <section className="success-card container">
          {!result && !error && <><p className="eyebrow">Confirming payment</p><h1>One moment…</h1><p>We’re retrieving your secure booking confirmation.</p></>}
          {error && <><span className="success-icon warning" aria-hidden="true">!</span><p className="eyebrow">We can help</p><h1>Let’s verify your booking.</h1><p>{error}</p><a className="button" href={PHONE_LINK}>Call {PHONE_DISPLAY}</a></>}
          {result && <>
            <span className="success-icon" aria-hidden="true">✓</span>
            <p className="eyebrow">Payment received</p>
            <h1>Thank you, {result.customerName}.</h1>
            <p>Your {result.serviceName.toLowerCase()} is booked. Save the confirmation below for your records.</p>
            <div className="confirmation-number"><span>Confirmation</span><strong>{result.confirmationCode}</strong></div>
            <div className="success-details"><div><span>Date</span><strong>{result.bookingDate}</strong></div><div><span>Arrival</span><strong>{result.startTime}</strong></div><div><span>Paid</span><strong>{formatMoney(result.totalCents)}</strong></div></div>
            <div className="success-actions"><a className="button" href="/">Back to home</a><a className="text-link" href={PHONE_LINK}>Call {PHONE_DISPLAY}</a></div>
          </>}
        </section>
      </main>
    </PageShell>
  );
}
