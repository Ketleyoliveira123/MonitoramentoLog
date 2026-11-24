"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { api, ApiError } from "@/lib/api";
import type { Alert, Dashboard, LogEvent, MonitoredIp } from "@/types/api";

const REFRESH_INTERVAL_MS = 30_000;

export interface Snapshot {
  dashboard: Dashboard;
  alerts: Alert[];
  events: LogEvent[];
  ips: MonitoredIp[];
}

export type ApiStatus = "checking" | "online" | "offline";

interface MonitoringState {
  data: Snapshot | null;
  error: ApiError | null;
  apiStatus: ApiStatus;
  logAvailable: boolean | null;
  refreshing: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
}

const MonitoringContext = createContext<MonitoringState | null>(null);

/**
 * Busca todos os dados da API em conjunto para que todas as telas mostrem o mesmo
 * instante do log. Atualiza ao abrir, a cada 30 s (com a aba visível) e sob demanda.
 */
export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [logAvailable, setLogAvailable] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return; // evita requisições sobrepostas
    inFlight.current = true;
    setRefreshing(true);

    try {
      const health = await api.health();
      setApiStatus("online");
      setLogAvailable(health.log_file_available);

      const [dashboard, alerts, events, ips] = await Promise.all([
        api.dashboard(),
        api.alerts(),
        api.events(),
        api.ips(),
      ]);

      setData({ dashboard, alerts: alerts.items, events: events.items, ips: ips.items });
      setError(null);
      setLastUpdated(new Date());
    } catch (caught) {
      const apiError =
        caught instanceof ApiError ? caught : new ApiError("Erro inesperado ao carregar os dados.", "unexpected");

      setError(apiError);

      if (apiError.kind === "offline") {
        // Mantém os últimos dados visíveis; o cabeçalho indica que a API está fora do ar.
        setApiStatus("offline");
      } else {
        // O log não pôde ser lido: dados anteriores deixam de representar o arquivo atual.
        setData(null);
      }
    } finally {
      inFlight.current = false;
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Primeira carga ao montar e atualização periódica (sincronização com um sistema externo: a API).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [refresh]);

  return (
    <MonitoringContext.Provider
      value={{ data, error, apiStatus, logAvailable, refreshing, lastUpdated, refresh: () => void refresh() }}
    >
      {children}
    </MonitoringContext.Provider>
  );
}

export function useMonitoring() {
  const context = useContext(MonitoringContext);
  if (!context) throw new Error("useMonitoring deve ser usado dentro de <MonitoringProvider>.");
  return context;
}
