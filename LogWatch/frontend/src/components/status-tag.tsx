import type { Tone } from "@/lib/format";

export const toneText: Record<Tone, string> = {
  ok: "text-ok",
  info: "text-accent",
  warn: "text-warn",
  crit: "text-crit",
  neutral: "text-ink-muted",
};

/** Cada tom tem uma forma própria, para que o estado não dependa só da cor. */
export function ToneIcon({ tone, className = "" }: { tone: Tone; className?: string }) {
  const common = { width: 10, height: 10, viewBox: "0 0 10 10", "aria-hidden": true, className: `shrink-0 ${className}` };

  switch (tone) {
    case "ok":
      return (
        <svg {...common}>
          <circle cx="5" cy="5" r="4" fill="currentColor" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "warn":
      return (
        <svg {...common}>
          <path d="M5 0.8 L9.6 9.2 H0.4 Z" fill="currentColor" />
        </svg>
      );
    case "crit":
      return (
        <svg {...common}>
          <rect x="1.8" y="1.8" width="6.4" height="6.4" transform="rotate(45 5 5)" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="5" cy="5" r="2.2" fill="currentColor" />
        </svg>
      );
  }
}

export function StatusTag({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${toneText[tone]}`}>
      <ToneIcon tone={tone} />
      <span>{label}</span>
    </span>
  );
}
