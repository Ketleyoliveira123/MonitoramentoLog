
from log_reader import read_log_file
from log_parser import parse_log_line
from analyzer import analyze_events
from alerts import generate_alerts

file_path = "data/raw/auth.log"

logs = read_log_file(file_path)

events = []

for log in logs:
    event = parse_log_line(log)

    if event:
        events.append(event)

suspicious_ips = analyze_events(events)

alerts = generate_alerts(suspicious_ips)

print("\n=== ALERTAS DE SEGURANÇA ===")

if alerts:
    for alert in alerts:
        print(
            f"[{alert['severity']}] "
            f"IP: {alert['ip']} - {alert['message']}"
        )
else:
    print("Nenhuma atividade suspeita identificada.")

