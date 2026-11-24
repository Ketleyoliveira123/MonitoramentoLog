
from analyzer import analyze_events


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


def test_custom_threshold():
    events = [{"ip": "10.0.0.1", "event": "LOGIN", "status": "FAILED"}] * 2

    assert analyze_events(events, threshold=2)[0]["failed_attempts"] == 2
    assert analyze_events(events, threshold=5) == []


def test_multiple_ips_counted_separately():
    events = (
        [{"ip": "10.0.0.1", "event": "LOGIN", "status": "FAILED"}] * 3
        + [{"ip": "10.0.0.2", "event": "LOGIN", "status": "FAILED"}] * 2
    )

    result = analyze_events(events)

    assert [item["ip"] for item in result] == ["10.0.0.1"]


def test_ignore_failed_non_login_events():
    events = [{"ip": "10.0.0.1", "event": "LOGOUT", "status": "FAILED"}] * 3

    assert analyze_events(events) == []


def test_records_first_and_last_failure_time():
    events = [
        {"date": "2026-11-04", "time": "07:12:49", "ip": "10.0.0.1", "event": "LOGIN", "status": "FAILED"},
        {"date": "2026-11-04", "time": "07:12:35", "ip": "10.0.0.1", "event": "LOGIN", "status": "FAILED"},
        {"date": "2026-11-04", "time": "07:12:42", "ip": "10.0.0.1", "event": "LOGIN", "status": "FAILED"},
    ]

    result = analyze_events(events)

    assert result[0]["first_seen"] == "2026-11-04 07:12:35"
    assert result[0]["last_seen"] == "2026-11-04 07:12:49"


def test_timestamps_are_none_when_events_have_no_date():
    events = [{"ip": "10.0.0.1", "event": "LOGIN", "status": "FAILED"}] * 3

    result = analyze_events(events)

    assert result[0]["first_seen"] is None
    assert result[0]["last_seen"] is None
