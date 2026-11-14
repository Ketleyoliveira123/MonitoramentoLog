
from src.analyzer import analyze_events


def test_detect_suspicious_ip():
    events = [
        {
            "ip": "192.168.1.15",
            "event": "LOGIN",
            "status": "FAILED"
        },
        {
            "ip": "192.168.1.15",
            "event": "LOGIN",
            "status": "FAILED"
        },
        {
            "ip": "192.168.1.15",
            "event": "LOGIN",
            "status": "FAILED"
        }
    ]

    result = analyze_events(events)

    assert len(result) == 1
    assert result[0]["ip"] == "192.168.1.15"
    assert result[0]["failed_attempts"] == 3


def test_ignore_successful_logins():
    events = [
        {
            "ip": "192.168.1.10",
            "event": "LOGIN",
            "status": "SUCCESS"
        }
    ]

    result = analyze_events(events)

    assert len(result) == 0


def test_ignore_below_threshold():
    events = [
        {
            "ip": "192.168.1.15",
            "event": "LOGIN",
            "status": "FAILED"
        },
        {
            "ip": "192.168.1.15",
            "event": "LOGIN",
            "status": "FAILED"
        }
    ]

    result = analyze_events(events)

    assert len(result) == 0
