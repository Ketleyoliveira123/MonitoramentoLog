# esse arquivo contém a função analyze_events que analisa uma lista de eventos de login e identifica endereços IP suspeitos com base no número de tentativas de login falhadas. 
# A função utiliza um defaultdict para contar as tentativas de login falhadas por endereço IP e retorna uma lista de dicionários contendo informações sobre os endereços IP suspeitos que ultrapassaram o limite definido pelo parâmetro threshold.
from collections import defaultdict


def analyze_events(events, threshold=3):
    failed_attempts = defaultdict(int) # serve para contar o número de tentativas de login falhadas por endereço IP. O defaultdict é usado para inicializar automaticamente o contador em 0 para cada novo endereço IP encontrado.
    failure_times = defaultdict(list) # guarda o horário de cada falha por IP, para informar quando a atividade começou e terminou. Não interfere na regra de detecção.

    for event in events:
        if event["event"] == "LOGIN" and event["status"] == "FAILED":
            failed_attempts[event["ip"]] += 1 # serve para incrementar o contador de tentativas de login falhadas para o endereço IP correspondente. Cada vez que uma tentativa de login falhada é encontrada, o contador é incrementado em 1.

            timestamp = _event_timestamp(event)
            if timestamp:
                failure_times[event["ip"]].append(timestamp)

    suspicious_ips = [] # serve para armazenar os endereços IP suspeitos que ultrapassaram o limite de tentativas de login falhadas.

    for ip, attempts in failed_attempts.items():
        if attempts >= threshold:
            times = failure_times[ip]
            suspicious_ips.append({
                "ip": ip,
                "failed_attempts": attempts,
                "reason": "Multiple failed login attempts",
                # O formato "AAAA-MM-DD HH:MM:SS" ordena corretamente como texto, então min/max funcionam.
                "first_seen": min(times) if times else None,
                "last_seen": max(times) if times else None,
            })

    return suspicious_ips


def _event_timestamp(event):
    # Eventos sem data/hora (ex.: montados manualmente em testes) não geram horário.
    date, time = event.get("date"), event.get("time")
    return f"{date} {time}" if date and time else None
