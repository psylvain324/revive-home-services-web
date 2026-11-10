import { useEffect, useRef, useState } from "react";
import { getBookingKoalaAttributionParameters } from "./salesVision";

export const BOOKING_KOALA_ORIGIN = "https://reviveco.bookingkoala.com";

export type BookingKoalaEmbedKind = "book" | "login" | "signup" | "contact" | "reviews";

type EmbedDefinition = {
  fallbackLabel: string;
  initialHeight: number;
  path: string;
  title: string;
};

export const bookingKoalaEmbeds: Record<BookingKoalaEmbedKind, EmbedDefinition> = {
  book: {
    fallbackLabel: "booking form",
    initialHeight: 1000,
    path: "/booknow?embed=true",
    title: "Revive Co secure online booking form",
  },
  login: {
    fallbackLabel: "customer login",
    initialHeight: 650,
    path: "/login?embed=true",
    title: "Revive Co customer login",
  },
  signup: {
    fallbackLabel: "account sign-up form",
    initialHeight: 800,
    path: "/signup?embed=true",
    title: "Create a Revive Co customer account",
  },
  contact: {
    fallbackLabel: "contact form",
    initialHeight: 1000,
    path: "/contact-us?embed=true",
    title: "Contact Revive Co",
  },
  reviews: {
    fallbackLabel: "customer reviews",
    initialHeight: 500,
    path: "/live-reviews/?embed=true",
    title: "Live Revive Co customer reviews",
  },
};

let resizerPromise: Promise<typeof import("iframe-resizer/js/iframeResizer").default> | null = null;
const loadResizer = () => resizerPromise ??= import("iframe-resizer/js/iframeResizer").then((module) => module.default);

type BookingKoalaEmbedProps = {
  deferUntilVisible?: boolean;
  kind: BookingKoalaEmbedKind;
};

export function BookingKoalaEmbed({ deferUntilVisible = false, kind }: BookingKoalaEmbedProps) {
  const definition = bookingKoalaEmbeds[kind];
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [active, setActive] = useState(!deferUntilVisible);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [resizeError, setResizeError] = useState(false);
  const sourceUrl = new URL(`${BOOKING_KOALA_ORIGIN}${definition.path}`);
  for (const [key, value] of Object.entries(getBookingKoalaAttributionParameters())) sourceUrl.searchParams.set(key, value);
  const source = sourceUrl.toString();

  useEffect(() => {
    if (active || !deferUntilVisible) return;
    const container = containerRef.current;
    if (!container || !("IntersectionObserver" in window)) {
      setActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setActive(true);
        observer.disconnect();
      },
      { rootMargin: "500px 0px" },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [active, deferUntilVisible]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let removeListeners: (() => void) | undefined;
    loadResizer()
      .then((iframeResizer) => {
        if (cancelled || !frameRef.current) return;
        const [resizedFrame] = iframeResizer({
          checkOrigin: true,
          heightCalculationMethod: "bodyOffset",
          scrolling: true,
          // Some tenant surfaces (notably an empty reviews feed) do not send a
          // resize handshake. The initial height and scroll fallback still work.
          warningTimeout: 0,
        }, frameRef.current);
        removeListeners = resizedFrame.iFrameResizer?.removeListeners;
      })
      .catch(() => {
        if (!cancelled) setResizeError(true);
      });
    return () => {
      cancelled = true;
      removeListeners?.();
    };
  }, [active, source]);

  return (
    <div
      className={`booking-koala-embed${frameLoaded ? " is-loaded" : ""}`}
      ref={containerRef}
      style={{ minHeight: definition.initialHeight }}
    >
      {!active && (
        <div className="booking-koala-loading" role="status">
          <span aria-hidden="true" />
          <p>Customer reviews will load as you reach this section.</p>
        </div>
      )}
      {active && (
        <>
          {!frameLoaded && (
            <div className="booking-koala-loading" role="status">
              <span aria-hidden="true" />
              <p>Loading {definition.fallbackLabel}…</p>
            </div>
          )}
          <iframe
            allow={kind === "book" ? "payment" : undefined}
            className="booking-koala-frame"
            data-bookingkoala-embed={kind}
            loading={deferUntilVisible ? "lazy" : "eager"}
            onLoad={() => setFrameLoaded(true)}
            ref={frameRef}
            referrerPolicy="origin"
            src={source}
            style={{ height: definition.initialHeight }}
            title={definition.title}
          />
        </>
      )}
      <div className="booking-koala-fallback">
        {resizeError && <p role="alert">Automatic form resizing is unavailable. The form remains scrollable below.</p>}
        <a href={source} target="_blank" rel="noopener noreferrer">
          Open the {definition.fallbackLabel} securely in a new tab <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  );
}
