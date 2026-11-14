
def generate_alerts(suspicious_ips):
    alerts = [] # serve para armazenar os alertas gerados com base nos endereços IP suspeitos identificados. Cada alerta contém informações sobre a gravidade, o endereço IP e uma mensagem descrevendo a situação.

    for item in suspicious_ips:
        alert = {
            "severity": "WARNING",
            "ip": item["ip"],
            "message": (
                f"Possível tentativa de força bruta: "
                f"{item['failed_attempts']} falhas de login."
            )
        }

        alerts.append(alert)

    return alerts
