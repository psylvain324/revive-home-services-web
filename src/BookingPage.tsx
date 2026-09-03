import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api, formatMoney } from "./api";
import { PageShell, PHONE_DISPLAY, PHONE_LINK } from "./SiteChrome";
import { getSalesVisionAttribution, initializeSalesVision, trackSalesVisionEvent } from "./salesVision";
import type { BookingPayload, BookingResponse, PublicConfig, TimeSlot } from "./types";

const fallbackConfig: PublicConfig = {
  timezone: "America/Phoenix",
  leadTimeHours: 24,
  slotIntervalMinutes: 30,
  bufferMinutes: 30,
  paymentEnabled: false,
  taxEnabled: false,
  depositPercent: 25,
  services: [
    { id: "standard-cleaning", name: "Residential cleaning", shortDescription: "A dependable clean for the essential rooms in your home.", description: "One-time or recurring residential service.", basePriceCents: null, durationMinutes: 120, active: true, sortOrder: 1 },
    { id: "deep-cleaning", name: "Deep cleaning", shortDescription: "Extra time and attention for a more complete reset.", description: "Detailed cleaning for buildup and neglected areas.", basePriceCents: null, durationMinutes: 210, active: true, sortOrder: 2 },
    { id: "move-cleaning", name: "Move-in / move-out", shortDescription: "Empty-property detailing for a fresh handoff.", description: "For renters, homeowners, real estate teams, and property managers.", basePriceCents: null, durationMinutes: 240, active: true, sortOrder: 3 },
    { id: "commercial-cleaning", name: "Commercial cleaning", shortDescription: "A custom plan for offices and professional spaces.", description: "Flexible commercial care based on the property.", basePriceCents: null, durationMinutes: 180, active: true, sortOrder: 4 },
    { id: "post-construction-cleaning", name: "Post-construction", shortDescription: "Fine-dust and surface detailing after building work.", description: "Renovation and new-construction cleanup.", basePriceCents: null, durationMinutes: 300, active: true, sortOrder: 5 },
  ],
  addOns: [
    { id: "inside-oven", name: "Inside oven", priceCents: 0, durationMinutes: 30, active: true },
    { id: "inside-refrigerator", name: "Inside refrigerator", priceCents: 0, durationMinutes: 30, active: true },
    { id: "interior-windows", name: "Interior windows", priceCents: 0, durationMinutes: 45, active: true },
    { id: "laundry-linens", name: "Laundry / linen change", priceCents: 0, durationMinutes: 30, active: true },
  ],
  hours: [
    { weekday: 0, enabled: false, openTime: "09:00", closeTime: "14:00" },
    { weekday: 1, enabled: true, openTime: "08:00", closeTime: "17:00" },
    { weekday: 2, enabled: true, openTime: "08:00", closeTime: "17:00" },
    { weekday: 3, enabled: true, openTime: "08:00", closeTime: "17:00" },
    { weekday: 4, enabled: true, openTime: "08:00", closeTime: "17:00" },
    { weekday: 5, enabled: true, openTime: "08:00", closeTime: "17:00" },
    { weekday: 6, enabled: true, openTime: "09:00", closeTime: "14:00" },
  ],
};

type FormState = Omit<BookingPayload, "attribution">;

const initialForm: FormState = {
  serviceId: new URLSearchParams(window.location.search).get("service") || "standard-cleaning",
  addOnIds: [],
  frequency: "one-time",
  propertyType: "house",
  bedrooms: 2,
  bathrooms: 2,
  squareFeet: null,
  date: "",
  time: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  postalCode: "",
  accessNotes: "",
  paymentChoice: "pay_later",
  marketingConsent: false,
};

function addDays(date: Date, count: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + count);
  return copy.toISOString().slice(0, 10);
}

function demoSlots(date: string): TimeSlot[] {
  if (!date) return [];
  const day = new Date(`${date}T12:00:00`).getDay();
  if (day === 0) return [];
  const end = day === 6 ? 14 : 17;
  const slots: TimeSlot[] = [];
  for (let hour = day === 6 ? 9 : 8; hour <= end - 2; hour += 1) {
    const value = `${String(hour).padStart(2, "0")}:00`;
    slots.push({ value, label: new Date(`2000-01-01T${value}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), available: true });
  }
  return slots;
}

export default function BookingPage() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [step, setStep] = useState(1);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState<BookingResponse | null>(null);

  useEffect(() => initializeSalesVision(), []);

  useEffect(() => {
    api.get<PublicConfig>("/api/public-config")
      .then((data) => {
        setConfig(data);
        setForm((current) => data.services.some((service) => service.id === current.serviceId)
          ? current
          : { ...current, serviceId: data.services[0]?.id || "" });
      })
      .catch(() => {
        if (import.meta.env.DEV) setConfig(fallbackConfig);
        else setMessage(`Online booking is temporarily unavailable. Please call ${PHONE_DISPLAY}.`);
      });
  }, []);

  const selectedService = config?.services.find((service) => service.id === form.serviceId);
  const selectedAddOns = useMemo(() => config?.addOns.filter((addOn) => form.addOnIds.includes(addOn.id)) ?? [], [config?.addOns, form.addOnIds]);
  const estimateCents = useMemo(() => {
    if (selectedService?.basePriceCents == null) return null;
    return selectedService.basePriceCents + selectedAddOns.reduce((sum, addOn) => sum + addOn.priceCents, 0);
  }, [selectedService, selectedAddOns]);
  const duration = (selectedService?.durationMinutes || 0) + selectedAddOns.reduce((sum, addOn) => sum + addOn.durationMinutes, 0);
  const minDate = addDays(new Date(), Math.max(1, Math.ceil((config?.leadTimeHours || 24) / 24)));

  useEffect(() => {
    if (!form.date || !form.serviceId) return;
    let current = true;
    const addOns = encodeURIComponent(form.addOnIds.join(","));
    const load = async () => {
      setLoadingSlots(true);
      try {
        const { slots: available } = await api.get<{ slots: TimeSlot[] }>(`/api/availability?date=${form.date}&service=${encodeURIComponent(form.serviceId)}&addons=${addOns}`);
        if (current) setSlots(available);
      } catch {
        if (current) setSlots(import.meta.env.DEV ? demoSlots(form.date) : []);
      } finally {
        if (current) setLoadingSlots(false);
      }
    };
    void load();
    return () => { current = false; };
  }, [form.date, form.serviceId, form.addOnIds]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => setForm((current) => ({ ...current, [field]: value }));
  const toggleAddOn = (id: string) => {
    setField("addOnIds", form.addOnIds.includes(id) ? form.addOnIds.filter((item) => item !== id) : [...form.addOnIds, id]);
    setField("time", "");
  };

  const goToStep = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
    trackSalesVisionEvent("booking_step", { action: `step_${next}`, category: "booking" });
  };

  const submitBooking = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    try {
      const response = await api.post<BookingResponse>("/api/bookings", {
        ...form,
        attribution: getSalesVisionAttribution(),
      });
      setConfirmation(response);
      trackSalesVisionEvent("booking_submitted", { category: "booking", value: response.totalCents || undefined });
      if (response.checkoutUrl) {
        window.location.assign(response.checkoutUrl);
        return;
      }
      setStatus("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "We could not complete your booking.");
    }
  };

  if (status === "success" && confirmation) {
    return (
      <PageShell compactHeader>
        <main id="main" className="subpage-main">
          <section className="success-card container">
            <span className="success-icon" aria-hidden="true">✓</span>
            <p className="eyebrow">Request received</p>
            <h1>You’re on Revive’s schedule.</h1>
            <p>{confirmation.message}</p>
            <div className="confirmation-number"><span>Confirmation</span><strong>{confirmation.confirmationCode}</strong></div>
            <div className="success-actions"><a className="button" href="/">Back to home</a><a className="text-link" href={PHONE_LINK}>Call {PHONE_DISPLAY}</a></div>
          </section>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell compactHeader>
      <main id="main" className="booking-page">
        <section className="booking-header">
          <div className="container">
            <p className="eyebrow">Online scheduling</p>
            <h1>Book your Revive clean.</h1>
            <p>Build your service, select an open time, and confirm the details. Quote-based projects can be submitted without payment.</p>
            <ol className="booking-steps" aria-label="Booking progress">
              {["Service", "Time", "Details"].map((label, index) => <li key={label} className={step >= index + 1 ? "active" : ""}><span>{index + 1}</span>{label}</li>)}
            </ol>
          </div>
        </section>

        <form className="booking-layout container" onSubmit={submitBooking}>
          <div className="booking-panel">
            {step === 1 && config && (
              <section aria-labelledby="service-step-title">
                <p className="panel-kicker">Step 1 of 3</p>
                <h2 id="service-step-title">What should we clean?</h2>
                <div className="option-grid">
                  {config.services.filter((service) => service.active).map((service) => (
                    <label className={`option-card${form.serviceId === service.id ? " selected" : ""}`} key={service.id}>
                      <input type="radio" name="serviceId" value={service.id} checked={form.serviceId === service.id} onChange={() => { setField("serviceId", service.id); setField("time", ""); }} />
                      <span className="option-check" aria-hidden="true">✓</span>
                      <strong>{service.name}</strong>
                      <p>{service.shortDescription}</p>
                      <small>{formatMoney(service.basePriceCents)}{service.basePriceCents != null ? " starting estimate" : ""}</small>
                    </label>
                  ))}
                </div>
                <div className="field-section">
                  <h3>Property &amp; frequency</h3>
                  <div className="form-row form-row-3">
                    <label>Property type<select value={form.propertyType} onChange={(e) => setField("propertyType", e.target.value)}><option value="house">House</option><option value="apartment">Apartment / condo</option><option value="office">Office / commercial</option><option value="rental">Rental / short-term rental</option><option value="other">Other</option></select></label>
                    <label>Frequency<select value={form.frequency} onChange={(e) => setField("frequency", e.target.value)}><option value="one-time">One-time</option><option value="weekly">Weekly</option><option value="biweekly">Every 2 weeks</option><option value="monthly">Monthly</option><option value="custom">Custom</option></select></label>
                    <label>Approx. sq. ft.<input type="number" min="100" max="100000" value={form.squareFeet ?? ""} onChange={(e) => setField("squareFeet", e.target.value ? Number(e.target.value) : null)} placeholder="Optional" /></label>
                  </div>
                  <div className="form-row">
                    <label>Bedrooms<input type="number" min="0" max="20" value={form.bedrooms} onChange={(e) => setField("bedrooms", Number(e.target.value))} /></label>
                    <label>Bathrooms<input type="number" min="0" max="20" step="0.5" value={form.bathrooms} onChange={(e) => setField("bathrooms", Number(e.target.value))} /></label>
                  </div>
                </div>
                {config.addOns.some((addOn) => addOn.active) && (
                  <div className="field-section">
                    <h3>Optional add-ons</h3>
                    <div className="addon-grid">
                      {config.addOns.filter((addOn) => addOn.active).map((addOn) => (
                        <label key={addOn.id} className={form.addOnIds.includes(addOn.id) ? "selected" : ""}>
                          <input aria-label={`Add ${addOn.name}`} type="checkbox" checked={form.addOnIds.includes(addOn.id)} onChange={() => toggleAddOn(addOn.id)} />
                          <span><strong>{addOn.name}</strong><small>{addOn.priceCents > 0 ? `+${formatMoney(addOn.priceCents)}` : "Quote with service"} · +{addOn.durationMinutes} min</small></span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="panel-actions panel-actions-end"><button type="button" className="button" onClick={() => goToStep(2)} disabled={!form.serviceId}>Choose a time <span aria-hidden="true">→</span></button></div>
              </section>
            )}

            {step === 2 && (
              <section aria-labelledby="time-step-title">
                <p className="panel-kicker">Step 2 of 3</p>
                <h2 id="time-step-title">When should we arrive?</h2>
                <label className="date-field">Preferred date<input type="date" min={minDate} value={form.date} onChange={(e) => { setField("date", e.target.value); setField("time", ""); }} required /></label>
                <div className="availability-note"><span aria-hidden="true">◷</span><p>Times shown are based on Revive’s current business hours and existing appointments. Time zone: <strong>{config?.timezone.replace("_", " ")}</strong>.</p></div>
                <div className="slot-grid" aria-live="polite">
                  {!form.date && <p className="empty-state">Choose a date to see available arrival times.</p>}
                  {loadingSlots && <p className="empty-state">Checking the schedule…</p>}
                  {!loadingSlots && form.date && slots.length === 0 && <p className="empty-state">No online times are open that day. Try another date or call {PHONE_DISPLAY}.</p>}
                  {!loadingSlots && slots.filter((slot) => slot.available).map((slot) => (
                    <label className={form.time === slot.value ? "selected" : ""} key={slot.value}>
                      <input type="radio" name="time" value={slot.value} checked={form.time === slot.value} onChange={() => setField("time", slot.value)} />
                      {slot.label}
                    </label>
                  ))}
                </div>
                <div className="panel-actions"><button type="button" className="button button-ghost" onClick={() => goToStep(1)}>Back</button><button type="button" className="button" onClick={() => goToStep(3)} disabled={!form.date || !form.time}>Continue <span aria-hidden="true">→</span></button></div>
              </section>
            )}

            {step === 3 && (
              <section aria-labelledby="details-step-title">
                <p className="panel-kicker">Step 3 of 3</p>
                <h2 id="details-step-title">Where should we send the confirmation?</h2>
                <div className="field-section first-field-section">
                  <h3>Your details</h3>
                  <div className="form-row"><label>First name<input value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} autoComplete="given-name" required /></label><label>Last name<input value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} autoComplete="family-name" required /></label></div>
                  <div className="form-row"><label>Email<input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} autoComplete="email" required /></label><label>Phone<input type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} autoComplete="tel" required /></label></div>
                </div>
                <div className="field-section">
                  <h3>Service address</h3>
                  <label>Street address<input value={form.address1} onChange={(e) => setField("address1", e.target.value)} autoComplete="address-line1" required /></label>
                  <label>Unit / suite<input value={form.address2} onChange={(e) => setField("address2", e.target.value)} autoComplete="address-line2" /></label>
                  <div className="form-row form-row-address"><label>City<input value={form.city} onChange={(e) => setField("city", e.target.value)} autoComplete="address-level2" required /></label><label>State<input value={form.state} onChange={(e) => setField("state", e.target.value.toUpperCase())} maxLength={2} autoComplete="address-level1" required /></label><label>ZIP code<input value={form.postalCode} onChange={(e) => setField("postalCode", e.target.value)} inputMode="numeric" autoComplete="postal-code" required /></label></div>
                  <label>Special instructions<textarea value={form.accessNotes} onChange={(e) => setField("accessNotes", e.target.value)} rows={4} placeholder="Pets, parking, priority rooms, or other helpful details. Please do not include alarm or lock codes." /></label>
                </div>
                {config?.paymentEnabled && estimateCents != null ? (
                  <div className="field-section payment-choice">
                    <h3>Payment preference</h3>
                    <label className={form.paymentChoice === "pay_now" ? "selected" : ""}><input aria-label="Pay securely online" type="radio" name="paymentChoice" value="pay_now" checked={form.paymentChoice === "pay_now"} onChange={() => setField("paymentChoice", "pay_now")} /><span><strong>Pay securely online</strong><small>Card, eligible Apple Pay or Google Pay through Stripe</small></span></label>
                    <label className={form.paymentChoice === "pay_later" ? "selected" : ""}><input aria-label="Request now and pay later" type="radio" name="paymentChoice" value="pay_later" checked={form.paymentChoice === "pay_later"} onChange={() => setField("paymentChoice", "pay_later")} /><span><strong>Request now, pay later</strong><small>Revive will confirm payment details with you</small></span></label>
                  </div>
                ) : (
                  <div className="quote-notice"><strong>This service will be confirmed as a quote.</strong><p>No payment is due with this request. Revive will review the property details and follow up before the appointment is finalized.</p></div>
                )}
                <label className="consent-row"><input type="checkbox" checked={form.marketingConsent} onChange={(e) => setField("marketingConsent", e.target.checked)} /><span>I would like to receive occasional service reminders and offers. Consent is optional and is not a condition of booking.</span></label>
                <p className="legal-note">By submitting, you agree to the <a href="/terms.html" target="_blank">booking terms</a> and acknowledge the <a href="/privacy.html" target="_blank">privacy notice</a>.</p>
                {message && <p className="form-status error" role="alert">{message}</p>}
                <div className="panel-actions"><button type="button" className="button button-ghost" onClick={() => goToStep(2)}>Back</button><button type="submit" className="button" disabled={status === "submitting"}>{status === "submitting" ? "Securing your time…" : form.paymentChoice === "pay_now" && config?.paymentEnabled ? "Continue to payment" : "Request appointment"}</button></div>
              </section>
            )}
          </div>

          <aside className="booking-summary" aria-label="Booking summary">
            <p className="panel-kicker">Your cleaning</p>
            <h2>{selectedService?.name || "Select a service"}</h2>
            <dl>
              <div><dt>Frequency</dt><dd>{form.frequency.replace("biweekly", "Every 2 weeks").replace("one-time", "One-time")}</dd></div>
              <div><dt>Property</dt><dd>{form.propertyType}</dd></div>
              <div><dt>Estimated time</dt><dd>{duration ? `${Math.floor(duration / 60)} hr${duration % 60 ? ` ${duration % 60} min` : ""}` : "—"}</dd></div>
              {form.date && <div><dt>Date</dt><dd>{new Date(`${form.date}T12:00:00`).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</dd></div>}
              {form.time && <div><dt>Arrival</dt><dd>{new Date(`2000-01-01T${form.time}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</dd></div>}
            </dl>
            {selectedAddOns.length > 0 && <div className="summary-addons"><span>Add-ons</span>{selectedAddOns.map((addOn) => <small key={addOn.id}>{addOn.name}</small>)}</div>}
            <div className="estimate"><span>{estimateCents == null ? "Pricing" : "Starting estimate"}</span><strong>{formatMoney(estimateCents)}</strong></div>
            {estimateCents != null && <p className="summary-note">Final scope and applicable tax are confirmed before service. {config?.depositPercent ? `Online checkout may collect a ${config.depositPercent}% deposit.` : ""}</p>}
            <div className="secure-note"><span aria-hidden="true">◇</span><p><strong>Secure checkout</strong>Payment details are processed by Stripe and are never stored on this site.</p></div>
            <a className="summary-phone" href={PHONE_LINK}>Need help? {PHONE_DISPLAY}</a>
          </aside>
        </form>
      </main>
    </PageShell>
  );
}
