// Tipos das respostas da API do LogWatch (espelham src/schemas.py no backend).

export type Classification = "SUSPICIOUS" | "ATTENTION" | "NORMAL";

export interface Health {
  status: "ok";
  log_file_available: boolean;
}

export interface LoginAttempts {
  ip: string;
  success: number;
  failed: number;
}

export interface Dashboard {
  total_events: number;
  successful_logins: number;
  failed_logins: number;
  unique_ips: number;
  suspicious_ips: number;
  invalid_lines: number;
  threshold: number;
  alerts_by_severity: Record<string, number>;
  events_by_level: Record<string, number>;
  login_attempts_by_ip: LoginAttempts[];
  generated_at: string;
}

export interface LogEvent {
  date: string;
  time: string;
  level: string;
  ip: string;
  user: string;
  event: string;
  status: string;
}

export interface Alert {
  type: string;
  severity: string;
  ip: string;
  failed_attempts: number;
  reason: string | null;
  first_seen: string | null;
  last_seen: string | null;
  message: string;
}

export interface MonitoredIp {
  ip: string;
  total_events: number;
  failed_attempts: number;
  successful_logins: number;
  users: string[];
  last_seen: string | null;
  classification: Classification;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}
