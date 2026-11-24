"""API HTTP do LogWatch.

Executar (a partir da pasta LogWatch):
    uvicorn api:app --app-dir src --reload

A API apenas expõe os resultados do pipeline existente (monitoring.py);
ela não contém regras de detecção próprias.
"""

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from monitoring import (
    LogSourceError,
    build_dashboard,
    build_ip_summary,
    get_log_file,
    run_monitoring,
)
from schemas import (
    AlertsResponse,
    DashboardResponse,
    EventsResponse,
    HealthResponse,
    IpsResponse,
)

DEFAULT_CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"

app = FastAPI(
    title="LogWatch API",
    description="Monitoramento de logs de autenticação.",
    version="0.1.0",
)

# Somente o frontend local pode consumir a API pelo navegador, e apenas com leitura (GET).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.environ.get("LOGWATCH_CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
        if origin.strip()
    ],
    allow_methods=["GET"],
    allow_headers=[],
)


def _load():
    # O arquivo é relido a cada requisição: assim o dashboard reflete o log atual.
    try:
        return run_monitoring(get_log_file())
    except LogSourceError as error:
        # A mensagem é genérica de propósito: não expõe o caminho do arquivo no servidor.
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.get("/health", response_model=HealthResponse)
def health():
    return {"status": "ok", "log_file_available": get_log_file().is_file()}


@app.get("/api/dashboard", response_model=DashboardResponse)
def dashboard():
    return build_dashboard(_load())


@app.get("/api/alerts", response_model=AlertsResponse)
def alerts():
    items = sorted(_load().alerts, key=lambda alert: alert["last_seen"] or "", reverse=True)
    return {"items": items, "total": len(items)}


@app.get("/api/events", response_model=EventsResponse)
def events():
    items = _load().events
    return {"items": items, "total": len(items)}


@app.get("/api/ips", response_model=IpsResponse)
def ips():
    items = build_ip_summary(_load())
    return {"items": items, "total": len(items)}
