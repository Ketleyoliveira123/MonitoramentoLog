"""Contratos de resposta da API (documentados automaticamente em /docs)."""

from typing import Literal, Optional

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: Literal["ok"]
    log_file_available: bool


class LoginAttempts(BaseModel):
    ip: str
    success: int
    failed: int


class DashboardResponse(BaseModel):
    total_events: int
    successful_logins: int
    failed_logins: int
    unique_ips: int
    suspicious_ips: int
    invalid_lines: int
    threshold: int
    alerts_by_severity: dict[str, int]
    events_by_level: dict[str, int]
    login_attempts_by_ip: list[LoginAttempts]
    generated_at: str


class Event(BaseModel):
    date: str
    time: str
    level: str
    ip: str
    user: str
    event: str
    status: str


class EventsResponse(BaseModel):
    items: list[Event]
    total: int


class Alert(BaseModel):
    type: str
    severity: str
    ip: str
    failed_attempts: int
    reason: Optional[str]
    first_seen: Optional[str]
    last_seen: Optional[str]
    message: str


class AlertsResponse(BaseModel):
    items: list[Alert]
    total: int


class MonitoredIp(BaseModel):
    ip: str
    total_events: int
    failed_attempts: int
    successful_logins: int
    users: list[str]
    last_seen: Optional[str]
    classification: Literal["SUSPICIOUS", "ATTENTION", "NORMAL"]


class IpsResponse(BaseModel):
    items: list[MonitoredIp]
    total: int
