"use client";

import { useMemo, useState } from "react";

import { DataGate, EmptyState, PageHeading } from "@/components/page-state";
import { StatusTag } from "@/components/status-tag";
import { useMonitoring } from "@/context/monitoring-provider";
import { eventLabel, formatLogTimestamp, formatNumber, levelTone, statusLabel } from "@/lib/format";
import type { LogEvent } from "@/types/api";

type FilterKey = "level" | "event" | "status";
type Filters = Record<FilterKey, string>;

const EMPTY_FILTERS: Filters = { level: "", event: "", status: "" };

const FILTERS: { key: FilterKey; label: string; format: (value: string) => string }[] = [
  { key: "level", label: "Nível", format: (value) => value },
  { key: "event", label: "Evento", format: eventLabel },
  { key: "status", label: "Status", format: (value) => statusLabel(value).label },
];

// Opções geradas a partir dos dados reais, para não oferecer filtros que nunca retornam resultado.
const distinct = (events: LogEvent[], key: FilterKey) => [...new Set(events.map((event) => event[key]))].sort();

function Events() {
  const { data } = useMonitoring();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const events = useMemo(() => data?.events ?? [], [data]);
  const filtered = useMemo(
    () =>
      events.filter((event) =>
        (Object.keys(filters) as FilterKey[]).every((key) => !filters[key] || event[key] === filters[key]),
      ),
    [events, filters],
  );

  if (!data) return null;

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeading title="Eventos" description="Registros do log interpretados, na ordem em que aparecem no arquivo." />

      {events.length === 0 ? (
        <EmptyState title="O arquivo de log não tem eventos.">
          Quando o arquivo receber registros no formato esperado, eles aparecem aqui.
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            {FILTERS.map(({ key, label, format }) => (
              <label key={key} className="flex flex-col gap-1 text-sm text-ink-muted">
                {label}
                <select
                  value={filters[key]}
                  onChange={(change) => setFilters((current) => ({ ...current, [key]: change.target.value }))}
                  className="min-w-36 rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-ink"
                >
                  <option value="">Todos</option>
                  {distinct(events, key).map((value) => (
                    <option key={value} value={value}>
                      {format(value)}
                    </option>
                  ))}
                </select>
              </label>
            ))}

            {hasFilters && (
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="rounded-md px-3 py-1.5 text-sm text-accent hover:bg-surface"
              >
                Limpar filtros
              </button>
            )}

            <p className="ml-auto text-sm text-ink-muted" aria-live="polite">
              {hasFilters
                ? `${formatNumber(filtered.length)} de ${formatNumber(events.length)} eventos`
                : `${formatNumber(events.length)} eventos`}
            </p>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Nenhum evento corresponde aos filtros.">
              Ajuste os filtros ou use “Limpar filtros” para ver todos os eventos.
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Data e hora</th>
                    <th scope="col">Nível</th>
                    <th scope="col">IP</th>
                    <th scope="col">Usuário</th>
                    <th scope="col">Evento</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event, index) => {
                    const status = statusLabel(event.status);
                    return (
                      // O log não tem identificador por linha; a posição + horário identifica o registro.
                      <tr key={`${index}-${event.date}-${event.time}-${event.ip}`}>
                        <td className="whitespace-nowrap font-mono text-ink-muted">
                          {formatLogTimestamp(`${event.date} ${event.time}`)}
                        </td>
                        <td>
                          <StatusTag tone={levelTone(event.level)} label={event.level} />
                        </td>
                        <td className="font-mono">{event.ip}</td>
                        <td>{event.user}</td>
                        <td>{eventLabel(event.event)}</td>
                        <td>
                          <StatusTag tone={status.tone} label={status.label} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}

export function EventsView() {
  return (
    <DataGate>
      <Events />
    </DataGate>
  );
}
