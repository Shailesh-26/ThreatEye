"""
Reads an uploaded log file into a clean list of dicts.

Kept separate from the database code so it can be tested on its own and
reused later (e.g. for a folder watcher or an API that receives logs).
"""

import math
from datetime import date, datetime

import pandas as pd

REQUIRED_COLUMNS = ["timestamp", "source_ip", "event_type"]
SUPPORTED_FORMATS = "CSV, XLSX, JSON, TXT (comma separated)"


class LogParseError(ValueError):
    """The file can't be used; the message is safe to show to the user."""


def read_dataframe(filename: str, fileobj) -> pd.DataFrame:
    name = (filename or "").lower()
    try:
        if name.endswith(".csv") or name.endswith(".txt"):
            return pd.read_csv(fileobj)
        if name.endswith(".xlsx"):
            return pd.read_excel(fileobj)
        if name.endswith(".json"):
            return pd.read_json(fileobj)
    except Exception as error:
        raise LogParseError(f"Could not read file: {error}") from error

    raise LogParseError(f"Unsupported file format. Supported formats: {SUPPORTED_FORMATS}.")


def clean_value(value):
    """Make one cell safe and consistent for MongoDB and JSON."""
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, float):
        if math.isnan(value):
            return None
        if value.is_integer():
            return int(value)  # 22.0 -> 22 (pandas turns ports into floats)
        return value
    if isinstance(value, (pd.Timestamp, datetime, date)):
        return value.isoformat()  # one timestamp format everywhere
    if isinstance(value, str):
        value = value.strip()
        return value or None
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    if hasattr(value, "item"):
        return clean_value(value.item())  # numpy numbers -> plain Python numbers
    return value


def parse_logs(filename: str, fileobj) -> tuple[list[dict], int]:
    """Returns (clean log rows, number of skipped rows)."""
    dataframe = read_dataframe(filename, fileobj)
    dataframe.columns = [str(column).strip().lower() for column in dataframe.columns]

    missing = [column for column in REQUIRED_COLUMNS if column not in dataframe.columns]
    if missing:
        raise LogParseError(
            f"Missing column(s): {', '.join(missing)}. Required: {', '.join(REQUIRED_COLUMNS)}."
        )

    logs, skipped = [], 0
    for record in dataframe.to_dict(orient="records"):
        row = {key: clean_value(value) for key, value in record.items()}
        if any(row.get(column) is None for column in REQUIRED_COLUMNS):
            skipped += 1  # a row without timestamp / ip / event is unusable
            continue
        row["event_type"] = str(row["event_type"]).lower()
        logs.append(row)

    if not logs:
        raise LogParseError("The file contains no usable log rows.")

    return logs, skipped
