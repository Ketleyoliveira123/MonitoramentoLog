"use client";

import { useMonitoring } from "@/context/monitoring-provider";
import { formatClock } from "@/lib/format";
import { StatusTag } from "@/components/status-tag";

function Wordmark() {
  // Marca: um traço de log com um pico, a forma do que a ferramenta procura.
  return (
    <span className="inline-flex items-center gap-2 text-ink">
      <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden className="text-warn">
        <path
          d="M1 10 H6 L8 10 L10 2 L12 12 L14 7 H21"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-lg font-semibold tracking-tight">LogWatch</span>
    </span>
  );
}

export function AppHeader() {
  const { apiStatus, logAvailable, lastUpdated, refresh, refreshing } = useMonitoring();

  const status =
    apiStatus === "checking"
      ? { tone: "neutral" as const, label: "Conectando à API" }
      : apiStatus === "offline"
        ? { tone: "crit" as const, label: "API fora do ar" }
        : logAvailable === false
          ? { tone: "warn" as const, label: "API online, log indisponível" }
          : { tone: "ok" as const, label: "API online" };

  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-canvas px-4 py-3 md:px-6">
      <Wordmark />

      <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span aria-live="polite">
          <StatusTag tone={status.tone} label={status.label} />
        </span>

        <span className="text-ink-muted">
          {lastUpdated ? (
            <>
              Atualizado às <time dateTime={lastUpdated.toISOString()}>{formatClock(lastUpdated)}</time>
            </>
          ) : (
            "Ainda não atualizado"
          )}
        </span>

        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-md border border-line-strong px-3 py-1.5 text-ink hover:bg-raised disabled:cursor-wait disabled:opacity-60"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            aria-hidden
            className={refreshing ? "animate-spin motion-reduce:animate-none" : ""}
          >
            <path
              d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {refreshing ? "Atualizando" : "Atualizar"}
        </button>
      </div>
    </header>
  );
}
