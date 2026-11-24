"""Orquestra o pipeline do LogWatch e monta os dados consumidos pela CLI e pela API.

Este módulo não contém regras de detecção: ele apenas reutiliza
log_reader -> log_parser -> analyzer -> alerts e agrega os resultados.
"""

import os
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from alerts import generate_alerts
from analyzer import analyze_events
from log_parser import parse_log_line
from log_reader import read_log_file

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_LOG_FILE = PROJECT_ROOT / "data" / "raw" / "auth.log"
DEFAULT_THRESHOLD = 3

# Classificação dos IPs (aprovada para o dashboard):
# SUSPICIOUS: atingiu o limite de falhas | ATTENTION: alguma falha | NORMAL: nenhuma falha
SUSPICIOUS = "SUSPICIOUS"
ATTENTION = "ATTENTION"
NORMAL = "NORMAL"
_RISK_ORDER = {SUSPICIOUS: 0, ATTENTION: 1, NORMAL: 2}


class LogSourceError(Exception):
    """O arquivo de log não pôde ser lido."""


class LogFileNotFoundError(LogSourceError):
    """O arquivo de log configurado não existe."""


@dataclass
class MonitoringResult:
    events: list
    invalid_lines: int
    suspicious_ips: list
    alerts: list
    threshold: int


def get_log_file():
    """Arquivo de log definido no servidor (variável LOGWATCH_LOG_FILE ou o exemplo do projeto).

    O caminho nunca vem do cliente HTTP.
    """
    configured = os.environ.get("LOGWATCH_LOG_FILE")
    return Path(configured) if configured else DEFAULT_LOG_FILE


def run_monitoring(file_path=None, threshold=DEFAULT_THRESHOLD):
    path = Path(file_path) if file_path else get_log_file()

    try:
        lines = read_log_file(path)
    except FileNotFoundError as error:
        raise LogFileNotFoundError("Arquivo de log não encontrado.") from error
    except (OSError, UnicodeDecodeError) as error:
        raise LogSourceError("Não foi possível ler o arquivo de log.") from error

    events = []
    invalid_lines = 0

    for line in lines:
        if not line.strip():
            continue  # linhas em branco não são registros, então não contam como inválidas

        event = parse_log_line(line)
        if event:
            events.append(event)
        else:
            invalid_lines += 1

    suspicious_ips = analyze_events(events, threshold=threshold)

    return MonitoringResult(
        events=events,
        invalid_lines=invalid_lines,
        suspicious_ips=suspicious_ips,
        alerts=generate_alerts(suspicious_ips),
        threshold=threshold,
    )


def _is_login(event, status):
    return event["event"] == "LOGIN" and event["status"] == status


def build_dashboard(result):
    attempts = defaultdict(lambda: {"success": 0, "failed": 0})

    for event in result.events:
        if _is_login(event, "SUCCESS"):
            attempts[event["ip"]]["success"] += 1
        elif _is_login(event, "FAILED"):
            attempts[event["ip"]]["failed"] += 1

    return {
        "total_events": len(result.events),
        "successful_logins": sum(item["success"] for item in attempts.values()),
        "failed_logins": sum(item["failed"] for item in attempts.values()),
        "unique_ips": len({event["ip"] for event in result.events}),
        "suspicious_ips": len(result.suspicious_ips),
        "invalid_lines": result.invalid_lines,
        "threshold": result.threshold,
        "alerts_by_severity": dict(Counter(alert["severity"] for alert in result.alerts)),
        "events_by_level": dict(Counter(event["level"] for event in result.events)),
        "login_attempts_by_ip": [
            {"ip": ip, **counts}
            for ip, counts in sorted(attempts.items(), key=lambda item: -item[1]["failed"])
        ],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def build_ip_summary(result):
    summary = {}

    for event in result.events:
        item = summary.setdefault(event["ip"], {
            "ip": event["ip"],
            "total_events": 0,
            "failed_attempts": 0,
            "successful_logins": 0,
            "users": set(),
            "last_seen": None,
        })
        item["total_events"] += 1
        item["users"].add(event["user"])

        if _is_login(event, "FAILED"):
            item["failed_attempts"] += 1
        elif _is_login(event, "SUCCESS"):
            item["successful_logins"] += 1

        timestamp = f"{event['date']} {event['time']}"
        if item["last_seen"] is None or timestamp > item["last_seen"]:
            item["last_seen"] = timestamp

    for item in summary.values():
        item["users"] = sorted(item["users"])
        item["classification"] = _classify(item["failed_attempts"], result.threshold)

    return sorted(
        summary.values(),
        key=lambda item: (_RISK_ORDER[item["classification"]], -item["failed_attempts"], item["ip"]),
    )


def _classify(failed_attempts, threshold):
    # Mesmo critério do analyzer (>= threshold) para que "suspeito" signifique a mesma coisa em todo o sistema.
    if failed_attempts >= threshold:
        return SUSPICIOUS
    if failed_attempts > 0:
        return ATTENTION
    return NORMAL
