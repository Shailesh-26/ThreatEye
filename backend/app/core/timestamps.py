"""Reading timestamps from log rows in one consistent way."""

from datetime import datetime, timezone


def parse_timestamp(value):
    """
    Turn a timestamp value into a datetime, or None if it can't be read.

    Accepts '2026-10-15 09:00:00', '2026-10-15T09:00:00', '...Z' and real
    datetime objects (Excel uploads). Timezone-aware values are converted to
    UTC and made "naive" so all timestamps can be compared with each other.
    """
    if value is None:
        return None

    if isinstance(value, datetime):
        parsed = value
    else:
        text = str(value).strip()
        if not text:
            return None
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        try:
            parsed = datetime.fromisoformat(text)
        except ValueError:
            return None

    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)

    return parsed
