import main


def test_main_uses_path_independent_of_cwd(tmp_path, monkeypatch, capsys):
    # Executa a partir de um diretório qualquer: o caminho padrão não pode depender do cwd.
    monkeypatch.chdir(tmp_path)

    main.main()

    output = capsys.readouterr().out
    assert "192.168.1.15" in output
    assert "192.168.1.30" in output


def test_main_reports_no_suspicious_activity(tmp_path, capsys):
    log_file = tmp_path / "auth.log"
    log_file.write_text(
        "2026-11-04 07:10:12 INFO IP=192.168.1.10 USER=ketley EVENT=LOGIN STATUS=SUCCESS\n",
        encoding="utf-8",
    )

    main.main(log_file)

    assert "Nenhuma atividade suspeita identificada." in capsys.readouterr().out


def test_import_does_not_execute_analysis(capsys):
    # Importar o módulo não deve imprimir nada (lógica protegida por __main__).
    import importlib

    importlib.reload(main)

    assert capsys.readouterr().out == ""
