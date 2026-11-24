import pytest

from log_reader import read_log_file


def test_read_existing_file(tmp_path):
    log_file = tmp_path / "auth.log"
    log_file.write_text("linha 1\nlinha 2\n", encoding="utf-8")

    lines = read_log_file(log_file)

    assert lines == ["linha 1\n", "linha 2\n"]


def test_read_empty_file(tmp_path):
    log_file = tmp_path / "vazio.log"
    log_file.write_text("", encoding="utf-8")

    assert read_log_file(log_file) == []


def test_missing_file_raises(tmp_path):
    with pytest.raises(FileNotFoundError):
        read_log_file(tmp_path / "nao_existe.log")
