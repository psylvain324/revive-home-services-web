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

function safeSessionGet(key: string) {
  try { return window.sessionStorage.getItem(key); } catch { return null; }
}

function safeSessionSet(key: string, value: string) {
  try { window.sessionStorage.setItem(key, value); } catch { /* Storage can be disabled. */ }
}

function readAttribution(): Record<string, string> {
  const saved = safeSessionGet(ATTRIBUTION_KEY);
  if (saved) {
    try { return JSON.parse(saved) as Record<string, string>; } catch { /* Ignore malformed device data. */ }
  }

  const params = new URLSearchParams(window.location.search);
  const attribution = {
    source: params.get("utm_source") || "direct",
    medium: params.get("utm_medium") || "none",
    campaign: params.get("utm_campaign") || "none",
    term: params.get("utm_term") || "",
    content: params.get("utm_content") || "",
    landingPage: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || "direct",
  };
  safeSessionSet(ATTRIBUTION_KEY, JSON.stringify(attribution));
  return attribution;
}

function visitorId() {
  const saved = safeSessionGet(VISITOR_KEY);
  if (saved) return saved;
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
