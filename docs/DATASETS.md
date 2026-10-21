# Sample datasets (`datasets/` folder)

Upload any of these on the **Logs** page. Each upload **replaces** the
previous data, then open **Alerts** to see what was detected.

Every file mixes attacks with normal activity, including some normal rows
that *look* suspicious (a `#` in a URL, `--` in a message, a normal
`<img>` tag). Those must **not** create alerts. That's how you check the
rules don't raise false alarms.

The automated tests (`backend/tests/test_datasets.py`) check these exact
expected results, so if you change a rule and a number changes, the tests
will tell you.

| File | What's inside | Expected alerts |
|---|---|---|
| `01_brute_force.csv` | 203.0.113.10: 8 failed logins in under 2 min against 4 accounts, **then a successful login**. 198.51.100.23: 6 failures in 2.5 min. Normal: a user who mistyped 3 times, and a user with 6 failures spread over 4 hours. | **2**: Brute Force 203.0.113.10 (**Critical**, possible compromise), Brute Force 198.51.100.23 (High) |
| `02_port_scan.csv` | 203.0.113.50: 20 different ports in 40 s. 198.51.100.77: 4 events an IDS already labelled `port_scan`. Normal: a client using only ports 80/443. A slow scan (1 port every 10 min) that stays under the rule's 60 s window. | **2**: Port Scan 203.0.113.50, Port Scan 198.51.100.77 (both Medium) |
| `03_sql_injection.csv` | 203.0.113.66: 5 different SQL injection techniques. 198.51.100.91: one `admin'--` login bypass. Normal look-alikes: `/docs#configuration`, `c# tutorial`, "build -- passed". | **2**: SQL Injection 203.0.113.66 (Critical), SQL Injection 198.51.100.91 (Medium) |
| `04_xss.csv` | 203.0.113.88: 5 XSS payloads (script tag, `onerror=`, `javascript:`, `<svg onload>`, `<iframe>`). 198.51.100.120: cookie-stealing script. Normal: a plain `<img src=...>`. | **2**: XSS 203.0.113.88 (High), XSS 198.51.100.120 (Medium) |
| `05_mixed_soc_day.csv` | **Main demo.** A full day: normal users plus 4 attackers. 203.0.113.50 scans ports, then brute-forces SSH. 198.51.100.91 tries SQL injection. 198.51.100.120 tries XSS. 203.0.113.10 guesses a password and gets in. | **5**: Brute Force 203.0.113.10 (Critical), SQL Injection 198.51.100.91 (High), Brute Force 203.0.113.50 (High), XSS 198.51.100.120 (High), Port Scan 203.0.113.50 (Medium) |
| `06_clean_baseline.csv` | Only normal activity, including all the look-alikes. | **0** alerts |
| `07_json_format.json` | Same idea as brute force, but as JSON and with `LOGIN_FAILED` in capitals. Tests the JSON upload and case handling. | **1**: Brute Force 203.0.113.200 (High) |
| `08_mixed_soc_day.xlsx` | The mixed day saved as an Excel file. Tests `.xlsx` upload. | Same **5** alerts as `05` |
| `99_invalid_missing_column.csv` | No `event_type` column. | Upload is **rejected** with "Missing column(s): event_type" |

## Log format

Required columns: `timestamp`, `source_ip`, `event_type`.

Optional columns the detectors use: `destination_ip`, `destination_port`,
`username`, `url`, `payload`, `query`, `request`, `message`, `user_agent`,
`status`. Any other columns are stored and shown, but not analysed.

- `timestamp`: `2026-10-15 10:00:00` or `2026-10-15T10:00:00` (ISO format).
- `event_type`: case doesn't matter. Recognised values:
  - failed login: `login_failed`, `failed_login`, `auth_failed`, `authentication_failure`, `logon_failure`
  - successful login: `login_success`, `successful_login`, `auth_success`, `authentication_success`, `logon_success`
  - network: `connection`, `connection_attempt`, `connection_denied`, `firewall_deny`, `firewall_allow`, `network_connection`, `port_scan`
  - anything else (e.g. `web_request`) is still checked by the SQL injection and XSS rules.

The IP addresses are from ranges reserved for documentation (203.0.113.x,
198.51.100.x) and private networks (10.x, 192.168.x), so they're not real
machines.
