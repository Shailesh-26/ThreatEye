"""
Builds the "why did this alert fire?" part of an alert.

evidence:          one item per log row that triggered the rule - when it
                   happened, which field matched, a short excerpt, and which
                   patterns matched.
matched_patterns:  the distinct pattern names that matched.
affected_assets:   URLs / endpoints / hosts that were targeted.
timeline:          the same events in time order, for a timeline view.
"""

from datetime import datetime
from urllib.parse import unquote_plus

from app.core.timestamps import parse_timestamp

EXCERPT_LENGTH = 160


def _excerpt(value) -> str:
    text = str(value)
    return text if len(text) <= EXCERPT_LENGTH else text[:EXCERPT_LENGTH] + "..."


def _sort_key(item):
    return parse_timestamp(item.get("timestamp")) or datetime.min


def _asset(entry):
    """The targeted page/host, e.g. '/products' (query string removed)."""
    value = (
        entry.get("url")
        or entry.get("endpoint")
        or entry.get("path")
        or entry.get("destination_ip")
    )
    if value is None:
        return None
    return str(value).split("?", 1)[0] or str(value)


class EvidenceService:

    @staticmethod
    def empty() -> dict:
        return {"evidence": [], "matched_patterns": [], "affected_assets": [], "timeline": []}

    @staticmethod
    def build(entries, patterns, fields) -> dict:
        """
        For pattern detectors. `patterns` is a list of (name, regex) and
        `fields` the log columns to check - the same ones the detector uses,
        so evidence always explains the real match.
        """
        evidence, timeline = [], []
        matched_patterns, affected_assets = set(), set()

        for entry in entries:
            for field in fields:
                value = entry.get(field)
                if value is None:
                    continue
                text = unquote_plus(str(value))
                names = [name for name, regex in patterns if regex.search(text)]
                if not names:
                    continue

                matched_patterns.update(names)
                asset = _asset(entry)
                if asset:
                    affected_assets.add(str(asset))

                evidence.append({
                    "timestamp": entry.get("timestamp"),
                    "source_ip": entry.get("source_ip"),
                    "field": field,
                    "excerpt": _excerpt(text),
                    "patterns": names,
                    "asset": asset,
                })

            timeline.append({
                "timestamp": entry.get("timestamp"),
                "event": entry.get("event_type"),
                "source_ip": entry.get("source_ip"),
                "asset": _asset(entry),
            })

        evidence.sort(key=_sort_key)
        timeline.sort(key=_sort_key)

        return {
            "evidence": evidence,
            "matched_patterns": sorted(matched_patterns),
            "affected_assets": sorted(affected_assets),
            "timeline": timeline,
        }

    @staticmethod
    def from_events(entries, note_field=None) -> dict:
        """For counting detectors (brute force, port scan): each event is evidence."""
        evidence, timeline, assets = [], [], set()

        for entry in entries:
            asset = _asset(entry)
            if asset:
                assets.add(str(asset))
            note = entry.get(note_field) if note_field else None

            evidence.append({
                "timestamp": entry.get("timestamp"),
                "source_ip": entry.get("source_ip"),
                "field": note_field if note is not None else "event_type",
                "excerpt": _excerpt(note if note is not None else entry.get("event_type")),
                "patterns": [str(entry.get("event_type"))],
                "asset": asset,
            })
            timeline.append({
                "timestamp": entry.get("timestamp"),
                "event": entry.get("event_type"),
                "source_ip": entry.get("source_ip"),
                "asset": asset,
            })

        evidence.sort(key=_sort_key)
        timeline.sort(key=_sort_key)

        return {
            "evidence": evidence,
            "matched_patterns": [],
            "affected_assets": sorted(assets),
            "timeline": timeline,
        }
