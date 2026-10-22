export type SiteIconName = "home" | "building" | "key" | "sparkles" | "broom" | "clipboard" | "message" | "phone";

export function SiteIcon({ name, className = "" }: { name: SiteIconName; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "home") return <svg {...common}><path d="m3 11 9-7 9 7" /><path d="M5.5 9.5V20h13V9.5" /><path d="M9.5 20v-6h5v6" /></svg>;
  if (name === "building") return <svg {...common}><path d="M4 21V5h10v16" /><path d="M14 9h6v12" /><path d="M7.5 8h3M7.5 12h3M7.5 16h3M17 12h1M17 16h1M2 21h20" /></svg>;
  if (name === "key") return <svg {...common}><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8M15 8l2 2M17 6l2 2" /></svg>;
  if (name === "sparkles") return <svg {...common}><path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2L12 3Z" /><path d="m18.5 13 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /><path d="m5.5 13 .7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" /></svg>;
  if (name === "broom") return <svg {...common}><path d="m14.5 3 2.5 2.5-7.7 7.7" /><path d="m8.2 12.2 3.6 3.6-4.1 5.1H3.8L2.6 19.7l5.6-7.5Z" /><path d="m5.1 17.3 3.3 3.3M7 14.7l3.4 3.4" /></svg>;
  if (name === "clipboard") return <svg {...common}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M8.5 9h7M8.5 13h7M8.5 17H13" /></svg>;
  if (name === "message") return <svg {...common}><path d="M21 11.5a8 8 0 0 1-8 8H6l-3 2 1-4.5A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8 10h8M8 14h5" /></svg>;
  return <svg {...common}><path d="M7.3 3.5 10 8 7.8 10.2c1.3 2.6 3.4 4.7 6 6L16 14l4.5 2.7-.8 3.3c-.2.8-.9 1.3-1.7 1.3C9.6 20.8 3.2 14.4 2.7 6c0-.8.5-1.5 1.3-1.7l3.3-.8Z" /></svg>;
}
