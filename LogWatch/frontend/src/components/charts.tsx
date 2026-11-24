"use client";

import { formatNumber, levelTone, plural } from "@/lib/format";
import { StatusTag } from "@/components/status-tag";
import type { LoginAttempts } from "@/types/api";

/** Tooltip acionado por hover ou foco do teclado na linha do gráfico. */
function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute -top-2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-line-strong bg-raised px-2.5 py-1.5 text-xs text-ink shadow-lg group-hover:block group-focus-visible:block"
    >
      {children}
    </span>
  );
}

const LEVEL_ORDER = ["ERROR", "WARNING", "INFO"];

/**
 * Eventos por nível: uma única série (magnitude), então todas as barras têm a mesma cor;
 * o nível é identificado pelo rótulo com ícone, não pela cor da barra.
 */
export function EventsByLevelChart({ data }: { data: Record<string, number> }) {
  // Ordem de gravidade conhecida; níveis desconhecidos vão para o final.
  const rank = (level: string) => {
    const index = LEVEL_ORDER.indexOf(level);
    return index === -1 ? LEVEL_ORDER.length : index;
  };
  const entries = Object.entries(data).sort(([a], [b]) => rank(a) - rank(b));
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const max = Math.max(1, ...entries.map(([, value]) => value));

  if (!entries.length) return <p className="text-sm text-ink-muted">Nenhum evento no log.</p>;

  return (
    <ul className="space-y-3">
      {entries.map(([level, value]) => {
        const percent = total ? Math.round((value / total) * 100) : 0;
        return (
          <li
            key={level}
            tabIndex={0}
            aria-label={`${level}: ${plural(value, "evento", "eventos")}, ${percent}%`}
            className="group relative grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3 rounded outline-offset-4"
          >
            <span className="text-sm">
              <StatusTag tone={levelTone(level)} label={level} />
            </span>
            <span className="h-2.5 rounded-sm bg-line/60">
              <span
                className="block h-full rounded-r-[4px] bg-series-neutral"
                style={{ width: `${(value / max) * 100}%` }}
              />
            </span>
            <span className="text-right text-sm tabular-nums text-ink">{formatNumber(value)}</span>
            <Tooltip>
              {level}: {plural(value, "evento", "eventos")} ({percent}% do total)
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Tentativas de login por IP. A falha começa na linha de base para que o marcador
 * do limite de detecção fique na mesma escala das falhas.
 */
export function LoginAttemptsChart({ data, threshold }: { data: LoginAttempts[]; threshold: number }) {
  if (!data.length) return <p className="text-sm text-ink-muted">Nenhuma tentativa de login no log.</p>;

  const max = Math.max(threshold, ...data.map((item) => item.failed + item.success));
  const thresholdLeft = `${(threshold / max) * 100}%`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-series-failed" aria-hidden /> Falha
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-series-success" aria-hidden /> Sucesso
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 border-l border-dashed border-ink-muted" aria-hidden /> Limite de detecção ({threshold}{" "}
          falhas)
        </span>
      </div>

      <ul className="space-y-2.5">
        {data.map((item) => {
          const reached = item.failed >= threshold;
          return (
            <li
              key={item.ip}
              tabIndex={0}
              aria-label={`${item.ip}: ${plural(item.failed, "falha", "falhas")}, ${plural(item.success, "sucesso", "sucessos")}`}
              className="group relative grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3 rounded outline-offset-4"
            >
              <span className={`font-mono text-sm ${reached ? "text-warn" : "text-ink"}`}>{item.ip}</span>

              <span className="relative flex h-2.5 gap-[2px]">
                {item.failed > 0 && (
                  <span
                    className={`h-full rounded-[2px] bg-series-failed ${item.success === 0 ? "rounded-r-[4px]" : ""}`}
                    style={{ width: `${(item.failed / max) * 100}%` }}
                  />
                )}
                {item.success > 0 && (
                  <span
                    className="h-full rounded-[2px] rounded-r-[4px] bg-series-success"
                    style={{ width: `${(item.success / max) * 100}%` }}
                  />
                )}
                <span
                  aria-hidden
                  className="absolute -inset-y-1 border-l border-dashed border-ink-muted"
                  style={{ left: thresholdLeft }}
                />
              </span>

              <span className="text-right text-sm tabular-nums text-ink-muted">
                <span className={item.failed ? "text-ink" : ""}>{item.failed}</span>
                <span aria-hidden> / </span>
                {item.success}
              </span>

              <Tooltip>
                {item.ip}: {plural(item.failed, "falha", "falhas")}, {plural(item.success, "sucesso", "sucessos")}
                {reached ? " (atingiu o limite)" : ""}
              </Tooltip>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-ink-faint">Valores: falhas / sucessos.</p>
    </div>
  );
}
