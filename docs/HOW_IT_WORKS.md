# How ThreatEye works

## The big picture

```text
 You upload a log file
        │
        ▼
 log_parser.py      read file → clean rows → check required columns
        │
        ▼
 MongoDB "logs"     the current dataset (each upload replaces it)
        │
        ▼
 DetectionEngine    runs every detector in detector_registry.py
   ├─ BruteForceDetector    counting + time window
   ├─ PortScanDetector      distinct ports + time window
   ├─ SQLInjectionDetector  regex patterns
   └─ XSSDetector           regex patterns
        │  each detector returns alerts built by base.build_alert(), using:
        │    ThreatScoreService  → severity, threat/confidence/risk, MITRE, advice
        │    EvidenceService     → which rows/fields/patterns caused it
        │    IOCExtractor        → IPs, domains, URLs, emails, hashes
        ▼
 /api/v1/alerts     alerts sorted by risk, with IDs THREAT-001, 002, ...
 /api/v1/dashboard  counts for the dashboard cards
        │
        ▼
 React frontend     Dashboard, Logs, Alerts (+ investigation drawer), Detections
```

Alerts are **computed on request**: every time the Alerts page or Dashboard
loads, the detectors run again on the logs currently stored. Nothing about
alerts is saved yet. That's a planned step (see ROADMAP.md).

## What one request looks like

1. The browser calls `GET /api/v1/alerts/` through `frontend/src/services/api.js`,
   which adds the login token (`Authorization: Bearer ...`).
2. FastAPI checks the token (`core/dependencies.py → get_current_user`). No or
   bad token → `401`. If the token expired, `api.js` uses the refresh token to get
   a new one and retries automatically.
3. `api/v1/alerts.py` calls `AlertService.get_alerts()`, which loads logs from
   MongoDB and runs `DetectionEngine.run(logs)`.
4. The list of alert dicts is returned as JSON and the page renders it.

## How each detector decides

| Detector | Rule | Why this rule |
|---|---|---|
| Brute force | ≥ 5 failed logins from one IP inside any 5-minute window | People mistype passwords a few times; tools try dozens fast. The window stops slow, normal failures from adding up. |
| …escalation | A successful login from the same IP after the failures began → +25 threat, title changes, Critical | That's the moment a guess may have worked, the most important thing for an analyst to see. |
| Port scan | ≥ 10 *different* destination ports from one IP within 60 s, or ≥ 3 events a sensor labelled `port_scan` | Normal clients talk to a few ports (80/443). Scanners touch many quickly. |
| SQL injection | Any request field matches one of 8 SQL technique patterns (after URL-decoding) | Patterns need SQL *structure* (`' OR '1'='1`, `UNION SELECT`), not single characters, to avoid false alarms on `#` or `--`. |
| XSS | Any request field matches one of 6 script/HTML technique patterns (after URL-decoding) | A normal `<img src=...>` is fine; `<img onerror=...>` is not. |

The **sliding window** (`find_burst` in `detection/base.py`): sort the
events by time, then move a window across them, adding events on the right
and dropping events on the left that are too old. The busiest window is
what's compared with the threshold.

## How scores work (`services/threat_score_service.py`)

```text
threat_score = base + weight × log2(event_count) + bonus      (max 100)
confidence   = base_confidence + 8 × log2(event_count) + bonus (max 99)
risk_score   = 70% threat + 30% confidence
severity     = Critical ≥ 90, High ≥ 70, Medium ≥ 45, else Low
```

`log2` means every *doubling* of events adds `weight` points, so 5 and 500
attempts get different scores. Each alert also carries `score_reasons`, the
plain-English sentences behind the score.

## The alert format (what the API returns)

```json
{
  "id": "THREAT-001", "status": "Active",
  "detector_id": "brute_force", "title": "...", "event": "...", "icon": "shield",
  "source_ip": "203.0.113.10", "count": 8,
  "first_seen": "...", "last_seen": "...", "detected_at": "...",
  "severity": "Critical", "threat_score": 99, "confidence": 99, "risk_score": 99,
  "mitre": "T1110", "mitre_name": "Brute Force", "recommendation": "...",
  "score_reasons": ["8 failed logins within 5 minutes", "..."],
  "evidence": [{"timestamp": "...", "field": "payload", "excerpt": "...", "patterns": ["..."], "asset": "/login"}],
  "matched_patterns": ["..."], "affected_assets": ["/login"], "timeline": [ ... ],
  "iocs": {"ips": [], "domains": [], "urls": [], "emails": [], "hashes": [], "hostnames": []}
}
```

Detectors may add their own extra fields (e.g. `compromise_suspected`,
`ports_probed`).

## Adding a new detector (example: command injection)

1. Create `backend/app/detection/command_injection.py`:

   ```python
   import re
   from app.detection.base import PatternDetector

   class CommandInjectionDetector(PatternDetector):
       id = "command_injection"
       name = "Command Injection"
       title = "Command Injection Attempt"
       event = "Command Injection"
       icon = "shield"
       description = "Shell command syntax in request data."

       PATTERNS = [
           ("Command chaining (; ls)", re.compile(r"[;&|]\s*(?:ls|cat|whoami|id|uname|wget|curl)\b", re.I)),
           ("Command substitution $( )", re.compile(r"\$\([^)]*\)|`[^`]+`")),
       ]
       SEARCH_FIELDS = ["url", "payload", "query", "request", "command"]
   ```

2. Add a scoring profile for `"command_injection"` in `threat_score_service.py`
   (MITRE, base score, weight, recommendation).
3. In `detector_registry.py`: import the class, add it to `ALL_DETECTORS`, and
   remove it from `PLANNED_DETECTORS`.
4. Add tests (attacks that must match, normal text that must not) and a
   sample dataset with its expected result.

The engine, `/detections/run/command_injection`, the Detections page and the
Alerts page all pick it up automatically. No other file changes.

A counting rule (like brute force) subclasses `BaseDetector` instead and
uses `find_burst()`.
