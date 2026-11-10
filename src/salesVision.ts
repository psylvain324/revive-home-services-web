type SalesVisionEvent = {
  event: string;
  action?: string;
  category?: string;
  label?: string;
  value?: number;
  path: string;
  timestamp: string;
  anonymousId: string;
  attribution: Record<string, string>;
};

const ATTRIBUTION_KEY = "sv_attribution";
const VISITOR_KEY = "sv_visitor";
const ATTRIBUTION_FIELDS = ["source", "medium", "campaign", "term", "content", "fbclid", "gclid", "msclkid", "ttclid", "landingPage", "referrer"] as const;

function safeSessionGet(key: string) {
  try { return window.sessionStorage.getItem(key); } catch { return null; }
}

function safeSessionSet(key: string, value: string) {
  try { window.sessionStorage.setItem(key, value); } catch { /* Storage can be disabled. */ }
}

function sanitizedReferrer() {
  if (!document.referrer) return "direct";
  try {
    const referrer = new URL(document.referrer);
    return `${referrer.origin}${referrer.pathname}`;
  } catch {
    return "direct";
  }
}

function cleanAttributionValue(value: unknown, max = 200) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function normalizeSavedAttribution(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const saved = value as Record<string, unknown>;
  const attribution = Object.fromEntries(ATTRIBUTION_FIELDS.map((key) => [
    key,
    cleanAttributionValue(saved[key], key === "landingPage" || key === "referrer" ? 500 : 200),
  ]));
  attribution.source ||= "direct";
  attribution.medium ||= "none";
  attribution.campaign ||= "none";
  attribution.landingPage ||= window.location.pathname;
  attribution.referrer ||= "direct";
  return attribution;
}

function readAttribution(): Record<string, string> {
  const saved = safeSessionGet(ATTRIBUTION_KEY);
  if (saved) {
    try {
      const normalized = normalizeSavedAttribution(JSON.parse(saved));
      if (normalized) return normalized;
    } catch { /* Ignore malformed device data. */ }
  }

  const params = new URLSearchParams(window.location.search);
  const attribution = {
    source: cleanAttributionValue(params.get("utm_source")) || "direct",
    medium: cleanAttributionValue(params.get("utm_medium")) || "none",
    campaign: cleanAttributionValue(params.get("utm_campaign")) || "none",
    term: cleanAttributionValue(params.get("utm_term")),
    content: cleanAttributionValue(params.get("utm_content")),
    fbclid: cleanAttributionValue(params.get("fbclid")),
    gclid: cleanAttributionValue(params.get("gclid")),
    msclkid: cleanAttributionValue(params.get("msclkid")),
    ttclid: cleanAttributionValue(params.get("ttclid")),
    landingPage: window.location.pathname,
    referrer: sanitizedReferrer().slice(0, 500),
  };
  safeSessionSet(ATTRIBUTION_KEY, JSON.stringify(attribution));
  return attribution;
}

function visitorId() {
  const saved = safeSessionGet(VISITOR_KEY);
  if (saved && /^[a-zA-Z0-9-]{8,100}$/.test(saved)) return saved;
  const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `sv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  safeSessionSet(VISITOR_KEY, id);
  return id;
}

function dispatch(payload: SalesVisionEvent) {
  const svWindow = window as Window & { dataLayer?: Array<Record<string, unknown>> };
  svWindow.dataLayer = svWindow.dataLayer || [];
  svWindow.dataLayer.push({ ...payload, event: `salesvision_${payload.event}` });
  window.dispatchEvent(new CustomEvent("salesvision:event", { detail: payload }));

  if (import.meta.env.PROD) {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    }
  }
}

export function getSalesVisionAttribution(): Record<string, string> {
  return { ...readAttribution(), anonymousId: visitorId() };
}

export function getBookingKoalaAttributionParameters() {
  const attribution = readAttribution();
  const parameters = {
    fbclid: attribution.fbclid,
    gclid: attribution.gclid,
    msclkid: attribution.msclkid,
    ttclid: attribution.ttclid,
    utm_campaign: attribution.campaign === "none" ? "" : attribution.campaign,
    utm_content: attribution.content,
    utm_medium: attribution.medium === "none" ? "" : attribution.medium,
    utm_source: attribution.source === "direct" ? "" : attribution.source,
    utm_term: attribution.term,
  };
  return Object.fromEntries(Object.entries(parameters)
    .filter(([, value]) => typeof value === "string" && value.length > 0)
    .map(([key, value]) => [key, value.slice(0, 200)]));
}

export function trackSalesVisionEvent(event: string, details: Partial<SalesVisionEvent> = {}) {
  dispatch({
    event,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
    anonymousId: visitorId(),
    attribution: readAttribution(),
    ...details,
  });
}

export function initializeSalesVision() {
  const attribution = getSalesVisionAttribution();
  document.documentElement.dataset.salesvision = "active";
  document.querySelectorAll<HTMLInputElement>("[data-sv-field]").forEach((field) => {
    const key = field.dataset.svField || "";
    field.value = attribution[key] || "";
  });
  trackSalesVisionEvent("page_view");

  const clickHandler = (event: MouseEvent) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-sv-action]");
    if (!target) return;
    trackSalesVisionEvent("conversion_click", {
      action: target.dataset.svAction,
      category: target.dataset.svCategory || "engagement",
      label: target.dataset.svLabel || target.textContent?.trim().slice(0, 100),
    });
  };
  document.addEventListener("click", clickHandler);
  return () => document.removeEventListener("click", clickHandler);
}
