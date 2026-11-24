from alerts import generate_alerts


def test_generate_alert_for_each_suspicious_ip():
    suspicious_ips = [
        {"ip": "192.168.1.15", "failed_attempts": 3, "reason": "Multiple failed login attempts"},
        {"ip": "192.168.1.30", "failed_attempts": 5, "reason": "Multiple failed login attempts"},
    ]

    alerts = generate_alerts(suspicious_ips)

    assert len(alerts) == 2
    assert alerts[0]["ip"] == "192.168.1.15"
    assert alerts[0]["severity"] == "WARNING"
    assert "3 falhas de login" in alerts[0]["message"]
    assert "5 falhas de login" in alerts[1]["message"]


def test_no_alerts_when_no_suspicious_ips():
    assert generate_alerts([]) == []


def test_alert_carries_type_reason_and_timestamps():
    suspicious_ips = [{
        "ip": "10.0.0.1",
        "failed_attempts": 3,
        "reason": "Multiple failed login attempts",
        "first_seen": "2026-11-04 07:12:35",
        "last_seen": "2026-11-04 07:12:49",
    }]

    alert = generate_alerts(suspicious_ips)[0]

    assert alert["type"] == "BRUTE_FORCE"
    assert alert["failed_attempts"] == 3
    assert alert["reason"] == "Multiple failed login attempts"
    assert alert["first_seen"] == "2026-11-04 07:12:35"
    assert alert["last_seen"] == "2026-11-04 07:12:49"
