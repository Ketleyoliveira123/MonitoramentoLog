# Vamos testar o log_parser.py

import pytest
from src.log_parser import parse_log_line

def test_parse_valid_log():
    line = (
        "2026-11-04 07:12:35 WARNING "
        "IP=192.168.1.15 USER=admin "
        "EVENT=LOGIN STATUS=FAILED"
    )

    result = parse_log_line(line)

    assert result is not None
    assert result["ip"] == "192.168.1.15"
    assert result["user"] == "admin"
    assert result["status"] == "FAILED"


def test_parse_invalid_log():
    line = "registro inválido"

    result = parse_log_line(line)

    assert result is None
