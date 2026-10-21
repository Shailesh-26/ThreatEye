"""Small helpers to build fake log rows in tests."""

from datetime import datetime, timedelta

START = datetime(2026, 10, 15, 10, 0, 0)


def at(seconds: int) -> str:
    return (START + timedelta(seconds=seconds)).strftime("%Y-%m-%d %H:%M:%S")


def log(seconds=0, ip="203.0.113.1", event="web_request", **fields) -> dict:
    return {"timestamp": at(seconds), "source_ip": ip, "event_type": event, **fields}
