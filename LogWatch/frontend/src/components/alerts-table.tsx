import { alertTypeLabel, formatLogTimestamp, reasonLabel, severityLabel } from "@/lib/format";
import { StatusTag } from "@/components/status-tag";
import type { Alert } from "@/types/api";

export function AlertsTable({ alerts, showReason = true }: { alerts: Alert[]; showReason?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Severidade</th>
            <th scope="col">IP de origem</th>
            <th scope="col">Tipo</th>
            <th scope="col" className="num">
              Tentativas
            </th>
            <th scope="col">Primeira falha</th>
            <th scope="col">Última falha</th>
            {showReason && <th scope="col">Motivo da detecção</th>}
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => {
            const severity = severityLabel(alert.severity);
            return (
              <tr key={`${alert.type}-${alert.ip}`}>
                <td>
                  <StatusTag tone={severity.tone} label={severity.label} />
                </td>
                <td className="font-mono">{alert.ip}</td>
                <td className="whitespace-nowrap">{alertTypeLabel(alert.type)}</td>
                <td className="num">{alert.failed_attempts}</td>
                <td className="whitespace-nowrap font-mono text-ink-muted">{formatLogTimestamp(alert.first_seen)}</td>
                <td className="whitespace-nowrap font-mono">{formatLogTimestamp(alert.last_seen)}</td>
                {showReason && <td className="min-w-56 text-ink-muted">{reasonLabel(alert.reason)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
