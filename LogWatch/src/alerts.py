
def generate_alerts(suspicious_ips):
    alerts = [] # serve para armazenar os alertas gerados com base nos endereços IP suspeitos identificados. Cada alerta contém informações sobre a gravidade, o endereço IP e uma mensagem descrevendo a situação.

    for item in suspicious_ips:
        alert = {
            "type": "BRUTE_FORCE",
            "severity": "WARNING",
            "ip": item["ip"],
            "failed_attempts": item["failed_attempts"],
            "reason": item.get("reason"),
            "first_seen": item.get("first_seen"),
            "last_seen": item.get("last_seen"),
            "message": (
                f"Possível tentativa de força bruta: "
                f"{item['failed_attempts']} falhas de login."
            )
        }

        alerts.append(alert)

    return alerts
