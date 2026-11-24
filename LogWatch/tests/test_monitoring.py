import pytest

from monitoring import (
    DEFAULT_LOG_FILE,
    LogFileNotFoundError,
    build_dashboard,
    build_ip_summary,
    get_log_file,
    run_monitoring,
)

SAMPLE = (
    "2026-11-04 07:10:12 INFO IP=10.0.0.1 USER=ana EVENT=LOGIN STATUS=SUCCESS\n"
    "2026-11-04 07:12:35 WARNING IP=10.0.0.2 USER=admin EVENT=LOGIN STATUS=FAILED\n"
    "2026-11-04 07:12:42 WARNING IP=10.0.0.2 USER=admin EVENT=LOGIN STATUS=FAILED\n"
    "2026-11-04 07:12:49 WARNING IP=10.0.0.2 USER=root EVENT=LOGIN STATUS=FAILED\n"
    "2026-11-04 07:13:01 ERROR IP=10.0.0.3 USER=root EVENT=LOGIN STATUS=FAILED\n"
    "2026-11-04 07:15:22 INFO IP=10.0.0.1 USER=ana EVENT=LOGOUT STATUS=SUCCESS\n"
    "linha corrompida\n"
    "\n"
)


@pytest.fixture
def sample_log(tmp_path):
    log_file = tmp_path / "auth.log"
    log_file.write_text(SAMPLE, encoding="utf-8")
    return log_file


def test_run_monitoring_counts_invalid_lines_but_ignores_blank_ones(sample_log):
    result = run_monitoring(sample_log)

    assert len(result.events) == 6
    assert result.invalid_lines == 1


def test_run_monitoring_detects_using_existing_rule(sample_log):
    result = run_monitoring(sample_log)

    assert [item["ip"] for item in result.suspicious_ips] == ["10.0.0.2"]
    assert len(result.alerts) == 1


def test_missing_file_raises_domain_error(tmp_path):
    with pytest.raises(LogFileNotFoundError):
        run_monitoring(tmp_path / "nao_existe.log")


def test_dashboard_indicators(sample_log):
    dashboard = build_dashboard(run_monitoring(sample_log))

    assert dashboard["total_events"] == 6
    assert dashboard["successful_logins"] == 1
    assert dashboard["failed_logins"] == 4
    assert dashboard["unique_ips"] == 3
    assert dashboard["suspicious_ips"] == 1
    assert dashboard["invalid_lines"] == 1
    assert dashboard["alerts_by_severity"] == {"WARNING": 1}
    assert dashboard["events_by_level"] == {"INFO": 2, "WARNING": 3, "ERROR": 1}


def test_dashboard_login_attempts_by_ip(sample_log):
    attempts = build_dashboard(run_monitoring(sample_log))["login_attempts_by_ip"]

    by_ip = {item["ip"]: item for item in attempts}
    assert by_ip["10.0.0.1"] == {"ip": "10.0.0.1", "success": 1, "failed": 0}
    assert by_ip["10.0.0.2"] == {"ip": "10.0.0.2", "success": 0, "failed": 3}


def test_ip_classification(sample_log):
    summary = {item["ip"]: item for item in build_ip_summary(run_monitoring(sample_log))}

    assert summary["10.0.0.1"]["classification"] == "NORMAL"
    assert summary["10.0.0.2"]["classification"] == "SUSPICIOUS"
    assert summary["10.0.0.3"]["classification"] == "ATTENTION"

    assert summary["10.0.0.1"]["total_events"] == 2
    assert summary["10.0.0.2"]["failed_attempts"] == 3
    assert summary["10.0.0.2"]["users"] == ["admin", "root"]
    assert summary["10.0.0.2"]["last_seen"] == "2026-11-04 07:12:49"


def test_ip_summary_ordered_by_risk(sample_log):
    summary = build_ip_summary(run_monitoring(sample_log))

    assert [item["ip"] for item in summary] == ["10.0.0.2", "10.0.0.3", "10.0.0.1"]


def test_empty_file_produces_zeroed_dashboard(tmp_path):
    log_file = tmp_path / "vazio.log"
    log_file.write_text("", encoding="utf-8")

    dashboard = build_dashboard(run_monitoring(log_file))

    assert dashboard["total_events"] == 0
    assert dashboard["alerts_by_severity"] == {}
    assert dashboard["login_attempts_by_ip"] == []


def test_log_file_defaults_to_project_sample(monkeypatch):
    monkeypatch.delenv("LOGWATCH_LOG_FILE", raising=False)

    assert get_log_file() == DEFAULT_LOG_FILE
    assert DEFAULT_LOG_FILE.is_file()


def test_log_file_can_be_overridden_by_environment(monkeypatch, tmp_path):
    monkeypatch.setenv("LOGWATCH_LOG_FILE", str(tmp_path / "outro.log"))

    assert get_log_file() == tmp_path / "outro.log"
