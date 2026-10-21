# Roadmap

ThreatEye is built as **modules around one pipeline** (ingest → detect →
investigate → respond → report), so each new feature plugs into a clear
place instead of being bolted on.

## Done

- **Step 1:** fixed the SQL injection crash, login required on all data routes, removed dead files.
- **Step 2:** plug-in detector design (`base.py` + registry), time-window rules,
  fewer false positives, explainable scores, evidence and IOC fixes, safer
  upload parsing, sample datasets with expected results, 52 automated tests.
- **Step 3A:** new design system ("the scope"), landing page with a replay of a
  real sample day, sign-up page, new app shell with command palette and session
  timer, sign-out that revokes the session on the server, login error fix.

## v1: what a reviewer should see working

| # | Step | Module |
|---|---|---|
| 3B | Dashboard (bento, real data) and Logs page redesign | Dashboard / Ingest |
| 3C | Alerts page with investigation panel: **Summary / Evidence / Timeline / IOCs**; Detections page | Investigate |
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

## Wishlist from earlier planning (`phases.md` / `structure.txt`)

These files were removed in step 2; every idea from them is kept here.
Nothing in this section is built yet.

**Session management leftovers:** cleanup of expired refresh tokens,
revoke all sessions, list active devices, cross-tab logout, login audit trail.

**More detectors:** DDoS, credential stuffing, impossible travel, malware
indicators, beaconing, DNS tunneling, PowerShell abuse, suspicious file
access, lateral movement, privilege escalation, ransomware indicators.

**Scoring:** factor in IOC reputation, event frequency and an IP's past behaviour.

**IOCs:** IPv6, real hostname detection, clickable IOCs that open a lookup.

**Threat intel:** VirusTotal, AbuseIPDB, GeoIP, ASN, WHOIS/ISP/country,
blacklist status, Shodan, Censys.

**Dashboard:** world attack map, MITRE heatmap, threat trends, top source
IPs, attack distribution, live alert stream, detection timeline, recent investigations.

**Logs:** filter and search logs; advanced filters (severity, MITRE
technique, country, IP, time range, status).

**Incidents:** assign analyst, notes, attachments, timeline, status, SOC workflow.

**Reports:** executive PDF, technical SOC report, CSV, weekly/monthly
summaries, MITRE coverage report.

**AI assistant:** alert summary, "explain this alert", root-cause hints,
chat with logs, detection suggestions. It assists the analyst and is
clearly labelled as AI output.

**Platform:** live log streaming (WebSockets), custom detection rules
(enable/disable/priority), asset and endpoint inventory with criticality,
roles (admin, analyst, tier-2, read-only auditor), audit log of every
action, notification center, global search, command palette, keyboard
shortcuts, accessibility, skeleton loaders, error boundaries, lazy loading,
virtualized tables, responsive design, dark/light theme.

**Enterprise-scale stretch ideas:** threat hunting workspace, IOC
management, YARA and Sigma rules, MITRE Navigator / ATT&CK matrix, CVE
explorer, network topology and attack-path graph, SOAR playbooks, UEBA,
evidence locker, forensics and malware-analysis pages, sandbox results,
threat campaign tracking, timeline replay, compliance dashboards
(ISO 27001, NIST, PCI DSS), multi-tenancy, API/integration management,
onboarding, Docker + cloud deployment.

**UI wishes:** animated login, entrance animations, motion and
transitions, an immersive and interactive feel that responds to the user.
