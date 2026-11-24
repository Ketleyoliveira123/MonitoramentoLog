"use client";

import { AlertsTable } from "@/components/alerts-table";
import { DataGate, EmptyState, PageHeading } from "@/components/page-state";
import { useMonitoring } from "@/context/monitoring-provider";

function Alerts() {
  const { data } = useMonitoring();
  if (!data) return null;

  const { alerts, dashboard } = data;

  return (
    <>
      <PageHeading
        title="Alertas"
        description={`IPs que atingiram o limite de ${dashboard.threshold} falhas de login, do mais recente para o mais antigo.`}
      />
      {alerts.length ? (
        <AlertsTable alerts={alerts} />
      ) : (
        <EmptyState title="Nenhum alerta no momento.">
          Nenhum IP atingiu o limite de {dashboard.threshold} falhas de login no arquivo analisado.
        </EmptyState>
      )}
    </>
  );
}

export function AlertsView() {
  return (
    <DataGate>
      <Alerts />
    </DataGate>
  );
}
