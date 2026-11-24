"use client";

import { DataGate, EmptyState, PageHeading } from "@/components/page-state";
import { StatusTag } from "@/components/status-tag";
import { useMonitoring } from "@/context/monitoring-provider";
import { classificationLabel, formatLogTimestamp, formatNumber } from "@/lib/format";

/** Falhas em relação ao limite de detecção: mostra o quanto falta para o IP virar suspeito. */
function FailureMeter({ failed, threshold }: { failed: number; threshold: number }) {
  const ratio = Math.min(failed / threshold, 1);
  const reached = failed >= threshold;

  return (
    <div className="flex items-center justify-end gap-3">
      <span className="hidden h-1.5 w-20 rounded-sm bg-line sm:block" aria-hidden>
        <span
          className={`block h-full rounded-sm ${reached ? "bg-series-failed" : failed ? "bg-accent" : ""}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </span>
      <span className="tabular-nums">
        {formatNumber(failed)}
        <span className="text-ink-faint"> de {threshold}</span>
      </span>
    </div>
  );
}

function Ips() {
  const { data } = useMonitoring();
  if (!data) return null;

  const { ips, dashboard } = data;
  const threshold = dashboard.threshold;

  return (
    <>
      <PageHeading
        title="IPs monitorados"
        description={
          <>
            <strong className="font-semibold text-warn">Suspeito</strong>: atingiu {threshold} falhas de login.{" "}
            <strong className="font-semibold text-accent">Atenção</strong>: teve ao menos uma falha.{" "}
            <strong className="font-semibold text-ok">Normal</strong>: nenhuma falha.
          </>
        }
      />

      {ips.length === 0 ? (
        <EmptyState title="Nenhum endereço IP encontrado no log." />
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Endereço IP</th>
                <th scope="col">Classificação</th>
                <th scope="col" className="num">
                  Falhas de login
                </th>
                <th scope="col" className="num">
                  Logins bem-sucedidos
                </th>
                <th scope="col" className="num">
                  Eventos
                </th>
                <th scope="col">Usuários</th>
                <th scope="col">Última atividade</th>
              </tr>
            </thead>
            <tbody>
              {ips.map((ip) => {
                const classification = classificationLabel[ip.classification];
                return (
                  <tr key={ip.ip}>
                    <td className="font-mono">{ip.ip}</td>
                    <td>
                      <StatusTag tone={classification.tone} label={classification.label} />
                    </td>
                    <td className="num">
                      <FailureMeter failed={ip.failed_attempts} threshold={threshold} />
                    </td>
                    <td className="num">{formatNumber(ip.successful_logins)}</td>
                    <td className="num">{formatNumber(ip.total_events)}</td>
                    <td className="text-ink-muted">{ip.users.join(", ")}</td>
                    <td className="whitespace-nowrap font-mono text-ink-muted">{formatLogTimestamp(ip.last_seen)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function IpsView() {
  return (
    <DataGate>
      <Ips />
    </DataGate>
  );
}
