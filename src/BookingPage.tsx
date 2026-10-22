import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "./api";
import { PageShell, PHONE_DISPLAY, PHONE_LINK } from "./SiteChrome";
import { getSalesVisionAttribution, initializeSalesVision, trackSalesVisionEvent } from "./salesVision";
import type { PublicConfig } from "./types";

const fallbackConfig: PublicConfig = {
  timezone: "America/Phoenix",
  leadTimeHours: 24,
  slotIntervalMinutes: 30,
  bufferMinutes: 30,
  paymentEnabled: false,
  taxEnabled: false,
  depositPercent: 25,
  services: [
    { id: "standard-cleaning", name: "Residential Cleaning", shortDescription: "A dependable clean for the essential rooms in your home.", description: "One-time or recurring residential service.", basePriceCents: null, durationMinutes: 120, active: true, sortOrder: 1 },
    { id: "deep-cleaning", name: "Deep Cleaning", shortDescription: "Extra time and attention for a more complete reset.", description: "Detailed cleaning for buildup and neglected areas.", basePriceCents: null, durationMinutes: 210, active: true, sortOrder: 2 },
    { id: "move-cleaning", name: "Move-In / Move-Out", shortDescription: "Empty-property detailing for a fresh handoff.", description: "For renters, homeowners, real estate teams, and property managers.", basePriceCents: null, durationMinutes: 240, active: true, sortOrder: 3 },
    { id: "commercial-cleaning", name: "Commercial Cleaning", shortDescription: "A custom plan for offices and professional spaces.", description: "Flexible commercial care based on the property.", basePriceCents: null, durationMinutes: 180, active: true, sortOrder: 4 },
    { id: "post-construction-cleaning", name: "Post-Construction", shortDescription: "Fine-dust and surface detailing after building work.", description: "Renovation and new-construction cleanup.", basePriceCents: null, durationMinutes: 300, active: true, sortOrder: 5 },
  ],
  addOns: [
    { id: "inside-oven", name: "Inside Oven", priceCents: 0, durationMinutes: 30, active: true },
    { id: "inside-refrigerator", name: "Inside Refrigerator", priceCents: 0, durationMinutes: 30, active: true },
    { id: "interior-windows", name: "Interior Windows", priceCents: 0, durationMinutes: 45, active: true },
    { id: "laundry-linens", name: "Laundry / Linen Change", priceCents: 0, durationMinutes: 30, active: true },
  ],
  hours: [],
};

type RequestForm = {
  serviceId: string;
  addOnIds: string[];
  frequency: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
};

const initialForm: RequestForm = {
  serviceId: new URLSearchParams(window.location.search).get("service") || "standard-cleaning",
  addOnIds: [],
  frequency: "one-time",
  propertyType: "house",
  bedrooms: 2,
  bathrooms: 2,
  squareFeet: null,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
  consent: false,
};

const frequencyLabels: Record<string, string> = {
  "one-time": "One-time",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  custom: "Custom",
};

const propertyLabels: Record<string, string> = {
  house: "House",
  apartment: "Apartment / Condo",
  office: "Office / Commercial",
  rental: "Rental / Short-Term Rental",
  other: "Other",
};

export default function BookingPage() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [form, setForm] = useState<RequestForm>(initialForm);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

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
        setConfig(fallbackConfig);
      });
  }, []);

  const selectedService = config?.services.find((service) => service.id === form.serviceId);
  const selectedAddOns = useMemo(
    () => config?.addOns.filter((addOn) => form.addOnIds.includes(addOn.id)) ?? [],
    [config?.addOns, form.addOnIds],
  );

  const setField = <K extends keyof RequestForm>(field: K, value: RequestForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleAddOn = (id: string) => {
    setField("addOnIds", form.addOnIds.includes(id)
      ? form.addOnIds.filter((item) => item !== id)
      : [...form.addOnIds, id]);
  };

  const goToStep = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
    trackSalesVisionEvent("request_step", { action: `step_${next}`, category: "lead" });
  };

  const submitRequest = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    try {
      const response = await api.post<{ message: string }>("/api/inquiries", {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        service: form.serviceId,
        message: form.message,
        consent: form.consent,
        requestDetails: {
          addOnIds: form.addOnIds,
          frequency: form.frequency,
          propertyType: form.propertyType,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          squareFeet: form.squareFeet,
        },
        attribution: getSalesVisionAttribution(),
      });
      setMessage(response.message);
      setStatus("success");
      trackSalesVisionEvent("service_request_submitted", { category: "lead" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "We could not send your request. Please call us instead.");
    }
  };

  if (status === "success") {
    return (
      <PageShell compactHeader>
        <main id="main" className="subpage-main">
          <section className="success-card container">
            <span className="success-icon" aria-hidden="true">✓</span>
            <p className="eyebrow">Request Sent</p>
            <h1>Thanks for Reaching Out.</h1>
            <p>{message}</p>
            <p className="request-reminder"><strong>This was a service request, not a scheduled appointment.</strong> Revive will contact you to discuss the details and next steps.</p>
            <div className="success-actions"><a className="button" href="/">Back to Home</a><a className="text-link" href={PHONE_LINK}>Call {PHONE_DISPLAY}</a></div>
          </section>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell compactHeader>
      <main id="main" className="booking-page request-page">
        <section className="booking-header">
          <div className="container">
            <p className="eyebrow">Contact Revive Co</p>
            <h1>Request Cleaning Service.</h1>
            <p>Tell us what your space needs and how to reach you. This form sends a request to the Revive team—it does not schedule an appointment or collect payment.</p>
            <ol className="booking-steps request-steps" aria-label="Service request progress">
              {["Service Details", "Contact Information"].map((label, index) => <li key={label} className={step >= index + 1 ? "active" : ""}><span>{index + 1}</span>{label}</li>)}
            </ol>
          </div>
        </section>

        <form className="booking-layout container" onSubmit={submitRequest}>
          <div className="booking-panel">
            {step === 1 && config && (
              <section aria-labelledby="service-step-title">
                <p className="panel-kicker">Step 1 of 2</p>
                <h2 id="service-step-title">What Can We Help With?</h2>
                <div className="option-grid">
                  {config.services.filter((service) => service.active).map((service) => (
                    <label className={`option-card${form.serviceId === service.id ? " selected" : ""}`} key={service.id}>
                      <input type="radio" name="serviceId" value={service.id} checked={form.serviceId === service.id} onChange={() => setField("serviceId", service.id)} />
                      <span className="option-check" aria-hidden="true">✓</span>
                      <strong>{service.name}</strong>
                      <p>{service.shortDescription}</p>
                      <small>Request Details</small>
                    </label>
                  ))}
                </div>
                <div className="field-section">
                  <h3>Property &amp; Frequency</h3>
                  <div className="form-row form-row-3">
                    <label>Property Type<select value={form.propertyType} onChange={(event) => setField("propertyType", event.target.value)}><option value="house">House</option><option value="apartment">Apartment / Condo</option><option value="office">Office / Commercial</option><option value="rental">Rental / Short-Term Rental</option><option value="other">Other</option></select></label>
                    <label>Frequency<select value={form.frequency} onChange={(event) => setField("frequency", event.target.value)}><option value="one-time">One-time</option><option value="weekly">Weekly</option><option value="biweekly">Every 2 weeks</option><option value="monthly">Monthly</option><option value="custom">Custom</option></select></label>
                    <label>Approx. Sq. Ft.<input type="number" min="100" max="100000" value={form.squareFeet ?? ""} onChange={(event) => setField("squareFeet", event.target.value ? Number(event.target.value) : null)} placeholder="Optional" /></label>
                  </div>
                  <div className="form-row">
                    <label>Bedrooms<input type="number" min="0" max="20" value={form.bedrooms} onChange={(event) => setField("bedrooms", Number(event.target.value))} /></label>
                    <label>Bathrooms<input type="number" min="0" max="20" step="0.5" value={form.bathrooms} onChange={(event) => setField("bathrooms", Number(event.target.value))} /></label>
                  </div>
                </div>
                {config.addOns.some((addOn) => addOn.active) && (
                  <div className="field-section">
                    <h3>Optional Add-On Requests</h3>
                    <div className="addon-grid">
                      {config.addOns.filter((addOn) => addOn.active).map((addOn) => (
                        <label key={addOn.id} className={form.addOnIds.includes(addOn.id) ? "selected" : ""}>
                          <input aria-label={`Request ${addOn.name}`} type="checkbox" checked={form.addOnIds.includes(addOn.id)} onChange={() => toggleAddOn(addOn.id)} />
                          <span><strong>{addOn.name}</strong><small>Add to my request</small></span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="panel-actions panel-actions-end"><button type="button" className="button" onClick={() => goToStep(2)} disabled={!form.serviceId}>Continue to Contact Details <span aria-hidden="true">→</span></button></div>
              </section>
            )}

            {step === 2 && (
              <section aria-labelledby="details-step-title">
                <p className="panel-kicker">Step 2 of 2</p>
                <h2 id="details-step-title">How Should We Reach You?</h2>
                <div className="field-section first-field-section">
                  <h3>Your Contact Information</h3>
                  <div className="form-row"><label>First Name<input value={form.firstName} onChange={(event) => setField("firstName", event.target.value)} autoComplete="given-name" required /></label><label>Last Name<input value={form.lastName} onChange={(event) => setField("lastName", event.target.value)} autoComplete="family-name" required /></label></div>
                  <div className="form-row"><label>Email<input type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} autoComplete="email" required /></label><label>Phone<input type="tel" value={form.phone} onChange={(event) => setField("phone", event.target.value)} autoComplete="tel" required /></label></div>
                </div>
                <div className="field-section">
                  <h3>Anything Else We Should Know?</h3>
                  <label>Request Details<textarea value={form.message} onChange={(event) => setField("message", event.target.value)} rows={6} required placeholder="Share your priorities, preferred timing, property location, or any questions. Please do not include alarm or lock codes." /></label>
                </div>
                <div className="quote-notice"><strong>No appointment will be scheduled from this form.</strong><p>Submitting sends your request to Revive. The team will review it and contact you to discuss availability, scope, and pricing.</p></div>
                <label className="consent-row"><input type="checkbox" checked={form.consent} onChange={(event) => setField("consent", event.target.checked)} required /><span>I agree that Revive Co may contact me by email or phone about this request. Message and data rates may apply.</span></label>
                <p className="legal-note">By submitting, you acknowledge the <a href="/privacy.html" target="_blank">privacy notice</a>.</p>
                {message && <p className="form-status error" role="alert">{message}</p>}
                <div className="panel-actions"><button type="button" className="button button-ghost" onClick={() => goToStep(1)}>Back</button><button type="submit" className="button" disabled={status === "submitting"}>{status === "submitting" ? "Sending Request…" : "Send Service Request"}</button></div>
              </section>
            )}
          </div>

          <aside className="booking-summary" aria-label="Service request summary">
            <p className="panel-kicker">Your Request</p>
            <h2>{selectedService?.name || "Select a Service"}</h2>
            <dl>
              <div><dt>Frequency</dt><dd>{frequencyLabels[form.frequency] || form.frequency}</dd></div>
              <div><dt>Property</dt><dd>{propertyLabels[form.propertyType] || form.propertyType}</dd></div>
              <div><dt>Bedrooms</dt><dd>{form.bedrooms}</dd></div>
              <div><dt>Bathrooms</dt><dd>{form.bathrooms}</dd></div>
              {form.squareFeet && <div><dt>Approx. Size</dt><dd>{form.squareFeet.toLocaleString()} sq. ft.</dd></div>}
            </dl>
            {selectedAddOns.length > 0 && <div className="summary-addons"><span>Add-On Requests</span>{selectedAddOns.map((addOn) => <small key={addOn.id}>{addOn.name}</small>)}</div>}
            <div className="secure-note request-note"><span aria-hidden="true">✉</span><p><strong>Request Only</strong>No scheduling or payment happens online. Revive will follow up personally by email or phone.</p></div>
            <a className="summary-phone" href={PHONE_LINK}>Prefer to talk? {PHONE_DISPLAY}</a>
          </aside>
        </form>
      </main>
    </PageShell>
  );
}
