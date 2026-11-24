import pytest
from fastapi.testclient import TestClient

from api import app

client = TestClient(app)

SAMPLE = (
    "2026-11-04 07:10:12 INFO IP=10.0.0.1 USER=ana EVENT=LOGIN STATUS=SUCCESS\n"
    "2026-11-04 07:12:35 WARNING IP=10.0.0.2 USER=admin EVENT=LOGIN STATUS=FAILED\n"
    "2026-11-04 07:12:42 WARNING IP=10.0.0.2 USER=admin EVENT=LOGIN STATUS=FAILED\n"
    "2026-11-04 07:12:49 WARNING IP=10.0.0.2 USER=admin EVENT=LOGIN STATUS=FAILED\n"
    "linha corrompida\n"
)


@pytest.fixture
def log_file(tmp_path, monkeypatch):
    path = tmp_path / "auth.log"
    path.write_text(SAMPLE, encoding="utf-8")
    monkeypatch.setenv("LOGWATCH_LOG_FILE", str(path))
    return path


@pytest.fixture
def missing_log(tmp_path, monkeypatch):
    monkeypatch.setenv("LOGWATCH_LOG_FILE", str(tmp_path / "nao_existe.log"))


@pytest.fixture
def empty_log(tmp_path, monkeypatch):
    path = tmp_path / "vazio.log"
    path.write_text("", encoding="utf-8")
    monkeypatch.setenv("LOGWATCH_LOG_FILE", str(path))


# --- /health -----------------------------------------------------------------

def test_health_ok(log_file):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "log_file_available": True}


def test_health_reports_missing_log_without_failing(missing_log):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["log_file_available"] is False


# --- /api/dashboard ----------------------------------------------------------

def test_dashboard(log_file):
    response = client.get("/api/dashboard")

    assert response.status_code == 200
    body = response.json()
    assert body["total_events"] == 4
    assert body["successful_logins"] == 1
    assert body["failed_logins"] == 3
    assert body["unique_ips"] == 2
    assert body["suspicious_ips"] == 1
    assert body["invalid_lines"] == 1
    assert body["alerts_by_severity"] == {"WARNING": 1}
    assert body["threshold"] == 3
    assert "generated_at" in body


def test_dashboard_with_empty_file(empty_log):
    response = client.get("/api/dashboard")

    assert response.status_code == 200
    assert response.json()["total_events"] == 0


def test_dashboard_with_missing_file_returns_503_without_leaking_path(missing_log, tmp_path):
    response = client.get("/api/dashboard")

    assert response.status_code == 503
    assert response.json()["detail"] == "Arquivo de log não encontrado."
    assert str(tmp_path) not in response.text


# --- /api/alerts -------------------------------------------------------------

def test_alerts(log_file):
    response = client.get("/api/alerts")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    alert = body["items"][0]
    assert alert["ip"] == "10.0.0.2"
    assert alert["type"] == "BRUTE_FORCE"
    assert alert["severity"] == "WARNING"
    assert alert["failed_attempts"] == 3
    assert alert["last_seen"] == "2026-11-04 07:12:49"


def test_alerts_missing_file(missing_log):
    assert client.get("/api/alerts").status_code == 503


# --- /api/events -------------------------------------------------------------

def test_events(log_file):
    response = client.get("/api/events")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 4
    assert body["items"][0] == {
        "date": "2026-11-04",
        "time": "07:10:12",
        "level": "INFO",
        "ip": "10.0.0.1",
        "user": "ana",
        "event": "LOGIN",
        "status": "SUCCESS",
    }


def test_events_empty_file(empty_log):
    assert client.get("/api/events").json() == {"items": [], "total": 0}


# --- /api/ips ----------------------------------------------------------------

def test_ips(log_file):
    response = client.get("/api/ips")

    assert response.status_code == 200
    items = response.json()["items"]
    assert [item["ip"] for item in items] == ["10.0.0.2", "10.0.0.1"]
    assert items[0]["classification"] == "SUSPICIOUS"
    assert items[1]["classification"] == "NORMAL"


# --- Segurança ---------------------------------------------------------------

def test_path_query_parameter_is_ignored(log_file, tmp_path):
    # Mesmo que o cliente tente indicar outro arquivo, a API usa apenas o configurado no servidor.
    other = tmp_path / "outro.log"
    other.write_text("", encoding="utf-8")

    response = client.get("/api/events", params={"file": str(other), "path": str(other)})

    assert response.json()["total"] == 4


def test_cors_allows_local_frontend(log_file):
    response = client.get("/health", headers={"Origin": "http://localhost:3000"})

    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_cors_blocks_unknown_origin(log_file):
    response = client.get("/health", headers={"Origin": "http://evil.example"})

    assert "access-control-allow-origin" not in response.headers


def test_write_methods_are_not_allowed(log_file):
    assert client.post("/api/events").status_code == 405
