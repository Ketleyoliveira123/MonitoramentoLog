from monitoring import DEFAULT_LOG_FILE, run_monitoring

# DEFAULT_LOG_FILE é calculado a partir da localização do código (src/ -> LogWatch/data/raw/auth.log),
# assim o programa funciona independentemente da pasta de onde é executado.


def main(file_path=DEFAULT_LOG_FILE):
    # O pipeline (ler -> interpretar -> analisar -> alertar) fica em monitoring.py,
    # compartilhado com a API, para não haver duas implementações do mesmo fluxo.
    alerts = run_monitoring(file_path).alerts

    print("\n=== ALERTAS DE SEGURANÇA ===")

    if alerts:
        for alert in alerts:
            print(
                f"[{alert['severity']}] "
                f"IP: {alert['ip']} - {alert['message']}"
            )
    else:
        print("Nenhuma atividade suspeita identificada.")


# Só executa a análise quando o arquivo é rodado diretamente (python src/main.py),
# não quando é importado por testes ou pela API.
if __name__ == "__main__":
    main()
