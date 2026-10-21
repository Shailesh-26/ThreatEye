# Roadmap

ThreatEye is built as **modules around one pipeline** (ingest → detect →
investigate → respond → report), so each new feature plugs into a clear
place instead of being bolted on.

## Done

- **Step 1:** fixed the SQL injection crash, login required on all data routes, removed dead files.
- **Step 2:** plug-in detector design (`base.py` + registry), time-window rules,
  fewer false positives, explainable scores, evidence and IOC fixes, safer
  upload parsing, sample datasets with expected results, 52 automated tests.

## v1: what a reviewer should see working

| # | Step | Module |
|---|---|---|
| 3 | Investigation drawer shows **Summary / Evidence / Timeline / IOCs** from real detector data; sign-up page | Investigate |
| 4 | **Save alerts** in MongoDB with permanent IDs, first/last seen, status (New → Acknowledged → Resolved), no duplicates on re-run | Alert lifecycle |
| 5 | **Upload history**: each upload is a batch; choose replace vs. keep | Ingest |
| 6 | **Incidents**: create from an alert, assign, notes, status, activity log | Respond |
| 7 | **Block list**: saved blocked IPs (who/when/why/expiry); blocked IPs flagged in new alerts. This is ThreatEye's own list, not a real firewall | Respond |
| 8 | Dashboard from saved data: alerts over time, top attackers, severity and type breakdown | Dashboard |
| 9 | README screenshots, Docker Compose (one command to run), GitHub Actions running tests | Polish |

## After v1: pick what interests you

Each one is a self-contained module:

- **More detectors** (one file each, see HOW_IT_WORKS.md): command injection,
  path traversal (`../`), credential stuffing (one IP → many accounts),
  impossible travel (same user, two countries in an hour), DNS tunneling, beaconing.
- **Attack chain correlation:** link alerts from the same IP into a story,
  e.g. "port scan → brute force → login" (the mixed dataset already contains one).
- **Threat intelligence:** look up IPs on AbuseIPDB / VirusTotal from the
  backend (API key stays on the server), cache results, show reputation in the drawer.
- **Reports:** export an incident or a day's alerts as PDF/CSV.
- **Real log formats:** parsers for Apache/Nginx access logs, Linux `auth.log`,
  Windows Security events (4625 = failed logon), turning them into the
  same columns.
- **Live ingestion:** an API endpoint or folder watcher that receives logs
  continuously instead of one file at a time.
- **Anomaly detection (ML):** Isolation Forest on per-IP behaviour, shown
  separately from rule-based alerts and labelled as a model's opinion.
- **Roles:** analyst vs. admin permissions.

Rule of thumb: finish and test one module before starting the next, and
only describe a feature as working once it is.
