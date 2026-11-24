"use client";

import { API_URL } from "@/lib/api";
import { useMonitoring } from "@/context/monitoring-provider";

/**
 * Estados de carregamento e erro compartilhados pelas telas.
 * Retorna null quando há dados para exibir.
 */
export function DataGate({ children }: { children: React.ReactNode }) {
  const { data, error, refresh, refreshing } = useMonitoring();

  if (data) return <>{children}</>;

  if (!error) {
    return (
      <div role="status" className="py-16 text-ink-muted">
        Analisando o arquivo de log…
      </div>
    );
  }

  const title =
    error.kind === "offline"
      ? "A API do LogWatch não está respondendo"
      : error.kind === "unavailable"
        ? "O arquivo de log não pôde ser lido"
        : "A API retornou um erro";

  const hint =
    error.kind === "offline" ? (
      <>
        Verifique se o backend está em execução em <code className="font-mono text-ink">{API_URL}</code>. Na pasta{" "}
        <code className="font-mono text-ink">LogWatch</code>, rode{" "}
        <code className="font-mono text-ink">uvicorn api:app --app-dir src --reload</code>.
      </>
    ) : error.kind === "unavailable" ? (
      <>
        Confira se o arquivo existe em <code className="font-mono text-ink">data/raw/auth.log</code> ou o caminho
        definido em <code className="font-mono text-ink">LOGWATCH_LOG_FILE</code>.
      </>
    ) : (
      "Consulte o terminal do backend para ver os detalhes."
    );

  return (
    <div role="alert" className="max-w-2xl border-l-2 border-crit py-2 pl-5 my-10">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-ink-muted">{error.message}</p>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{hint}</p>
      <button
        type="button"
        onClick={refresh}
        disabled={refreshing}
        className="mt-5 rounded-md border border-line-strong px-3 py-1.5 text-sm text-ink hover:bg-raised disabled:opacity-60"
      >
        {refreshing ? "Tentando…" : "Tentar novamente"}
      </button>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="py-10 text-center">
      <p className="text-ink">{title}</p>
      {children && <div className="mt-1 text-sm text-ink-muted">{children}</div>}
    </div>
  );
}

export function PageHeading({ title, description }: { title: string; description?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      {description && <p className="mt-1 max-w-[70ch] text-ink-muted">{description}</p>}
    </div>
  );
}
