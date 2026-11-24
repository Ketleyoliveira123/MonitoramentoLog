"use client";

import Link from "next/link";

import { AlertsTable } from "@/components/alerts-table";
import { EventsByLevelChart, LoginAttemptsChart } from "@/components/charts";
import { DataGate } from "@/components/page-state";
import { toneText, ToneIcon } from "@/components/status-tag";
import { useMonitoring, type Snapshot } from "@/context/monitoring-provider";
import { formatNumber, plural, severityLabel, type Tone } from "@/lib/format";

const RECENT_ALERTS = 5;

/** O veredito é a primeira coisa que um analista precisa saber: há algo a investigar? */
function verdict({ dashboard }: Snapshot): { tone: Tone; text: string } {
  const { suspicious_ips, failed_logins, threshold, total_events, alerts_by_severity } = dashboard;

  if (total_events === 0) {
    return { tone: "neutral", text: "O arquivo de log não tem eventos para analisar." };
  }
  if (suspicious_ips > 0) {
    const tone: Tone = alerts_by_severity.CRITICAL ? "crit" : "warn";
    return {
      tone,
      text: `${suspicious_ips === 1 ? "1 IP atingiu" : `${suspicious_ips} IPs atingiram`} o limite de ${threshold} falhas de login.`,
    };
  }
  if (failed_logins > 0) {
    return {
      tone: "info",
      text: `Nenhum IP atingiu o limite. ${plural(failed_logins, "falha isolada registrada", "falhas isoladas registradas")}.`,
    };
  }
  return { tone: "ok", text: "Nenhuma falha de login registrada." };
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: Tone }) {
  return (
    // Sem recuo no início de cada linha: itens ímpares no mobile (2 colunas), só o primeiro no desktop.
    <div className="px-5 py-4 max-sm:odd:pl-0 sm:first:pl-0">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className={`mt-1 text-3xl font-semibold tabular-nums ${tone ? toneText[tone] : "text-ink"}`}>{value}</dd>
    </div>
  );
}

function Overview() {
  const { data } = useMonitoring();
  if (!data) return null;

  const { dashboard, alerts } = data;
  const state = verdict(data);
  const severities = Object.entries(dashboard.alerts_by_severity);

  return (
    <div className="space-y-10">
      <section aria-labelledby="verdict">
        <h1 id="verdict" className={`flex max-w-[44ch] items-baseline gap-3 text-3xl font-semibold leading-tight tracking-tight md:text-4xl ${toneText[state.tone]}`}>
          <ToneIcon tone={state.tone} className="size-4 translate-y-[-0.15em] md:size-5" />
          <span>{state.text}</span>
        </h1>
        <p className="mt-3 text-ink-muted">
          {plural(dashboard.total_events, "evento analisado", "eventos analisados")} de{" "}
          {plural(dashboard.unique_ips, "endereço IP", "endereços IP")}.
          {dashboard.invalid_lines > 0 && (
            <span className="text-warn">
              {" "}
              {plural(dashboard.invalid_lines, "linha fora do formato foi ignorada", "linhas fora do formato foram ignoradas")}.
            </span>
          )}
        </p>
      </section>

      <dl className="grid grid-cols-2 divide-line border-y border-line sm:grid-cols-4 sm:divide-x [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-line sm:[&>*:nth-child(n+3)]:border-t-0">
        <Metric label="Eventos analisados" value={formatNumber(dashboard.total_events)} />
        <Metric label="Logins bem-sucedidos" value={formatNumber(dashboard.successful_logins)} />
        <Metric
          label="Logins com falha"
          value={formatNumber(dashboard.failed_logins)}
          tone={dashboard.failed_logins ? "warn" : undefined}
        />
        <Metric
          label="IPs suspeitos"
          value={`${formatNumber(dashboard.suspicious_ips)} de ${formatNumber(dashboard.unique_ips)}`}
          tone={dashboard.suspicious_ips ? "warn" : "ok"}
        />
      </dl>

      <div className="grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-0 lg:divide-x lg:divide-line">
        <section aria-labelledby="levels" className="lg:pr-8">
          <h2 id="levels" className="mb-4 font-semibold text-ink">
            Eventos por nível do log
          </h2>
          <EventsByLevelChart data={dashboard.events_by_level} />
        </section>
        <section aria-labelledby="attempts" className="lg:pl-8">
          <h2 id="attempts" className="mb-4 font-semibold text-ink">
            Tentativas de login por IP
          </h2>
          <LoginAttemptsChart data={dashboard.login_attempts_by_ip} threshold={dashboard.threshold} />
        </section>
      </div>

      <section aria-labelledby="recent">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 id="recent" className="font-semibold text-ink">
            Alertas mais recentes
          </h2>
          <p className="text-sm text-ink-muted">
            {severities.length
              ? severities
                  .map(([severity, count]) => `${count} de ${severityLabel(severity).label.toLowerCase()}`)
                  .join(", ")
              : "Nenhum alerta"}
          </p>
          {alerts.length > RECENT_ALERTS && (
            <Link href="/alertas" className="ml-auto text-sm text-accent hover:underline">
              Ver todos os {alerts.length} alertas
            </Link>
          )}
        </div>
        {alerts.length ? (
          <AlertsTable alerts={alerts.slice(0, RECENT_ALERTS)} showReason={false} />
        ) : (
          <p className="border-y border-line py-6 text-sm text-ink-muted">
            Nenhum IP atingiu o limite de {dashboard.threshold} falhas. Novos alertas aparecem aqui na próxima atualização.
          </p>
        )}
      </section>
    </div>
  );
}

export function OverviewView() {
  return (
    <DataGate>
      <Overview />
    </DataGate>
  );
}
