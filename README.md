# ThreatEye

A SOC-style threat hunting web app. Upload a file of security logs and
ThreatEye runs detection rules over it, raises alerts for attacks
(brute force, port scans, SQL injection, XSS), explains *why* each alert
fired, and shows everything on an analyst dashboard.

> Detection is **rule-based** (thresholds, time windows and regex
> patterns) and runs on **uploaded log files**. It is not a live network
> sensor and does not use machine learning yet. See [docs/ROADMAP.md](docs/ROADMAP.md).

## What works today

| Area | Status |
|---|---|
| Login with JWT access + refresh tokens | ✅ |
| Upload logs (CSV, XLSX, JSON, TXT) with validation | ✅ |
| Brute force detection (5+ failures in 5 min, escalates on successful login) | ✅ |
| Port scan detection (10+ ports in 60 s, or IDS-labelled events) | ✅ |
| SQL injection detection (8 technique patterns, URL-decoding) | ✅ |
| XSS detection (6 technique patterns, URL-decoding) | ✅ |
| Explainable scores: threat, confidence, risk, severity, reasons | ✅ |
| Evidence per alert: which field matched, excerpt, technique | ✅ (API; UI next) |
| IOC extraction (IPs, domains, URLs, emails, hashes) | ✅ |
| MITRE ATT&CK technique per alert | ✅ |
| Automated tests (`pytest`) | ✅ 52 tests |
| Saved alert history, incidents, IP blocking | Planned |

## Tech stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router, Axios, Recharts, Framer Motion
- **Backend:** Python, FastAPI, Pandas, python-jose (JWT), passlib/bcrypt
- **Database:** MongoDB (via Motor, async)

## Run it locally (Windows PowerShell)

Requirements: Python 3.12+, Node.js 20+, MongoDB running locally.

```powershell
# Terminal 1 - backend
cd backend
python -m venv .venv            # first time only
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt   # first time / after requirements change
copy .env.example .env          # first time only, then fill in the values
uvicorn app.main:app --reload   # http://127.0.0.1:8000  (API docs at /docs)

# Terminal 2 - frontend
cd frontend
npm install                     # first time only
npm run dev                     # http://localhost:5173
```

Create an account at http://127.0.0.1:8000/docs → `POST /api/v1/auth/register`,
then log in on the website and upload a file from [`datasets/`](datasets/README.md).

## Run the tests

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest
```

## Project layout

```text
backend/app/
  api/v1/        HTTP endpoints (auth, logs, detections, alerts, dashboard, health)
  core/          settings, password/JWT security, login check, timestamp parsing
  database/      MongoDB connection
  detection/     one file per detector + base.py (shared logic) + registry
  services/      upload parsing, alerts, dashboard, scoring, evidence, IOCs, auth
backend/tests/   automated tests
datasets/        sample logs with expected results
docs/            how it works + roadmap
frontend/src/    React app (pages, components, API services)
```

More detail: [docs/HOW_IT_WORKS.md](docs/HOW_IT_WORKS.md)
