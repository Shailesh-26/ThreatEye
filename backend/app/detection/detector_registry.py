DETECTORS = [
    {
        "id": "brute_force",
        "name": "Brute Force",
        "enabled": True,
        "severity": "Critical",
        "mitre": "T1110",
        "version": "1.0.0"
    },
    {
        "id": "port_scan",
        "name": "Port Scan",
        "enabled": True,
        "severity": "Medium",
        "mitre": "T1046",
        "version": "1.0.0"
    },
    {
        "id": "sql_injection",
        "name": "SQL Injection",
        "enabled": True,
        "severity": "Critical",
        "mitre": "T1190",
        "version": "1.0.0"
    },
    {
        "id": "xss",
        "name": "Cross Site Scripting",
        "enabled": True,
        "severity": "High",
        "mitre": "T1059",
        "version": "1.0.0"
    },
    {
        "id": "command_injection",
        "name": "Command Injection",
        "enabled": False,
        "severity": "Critical",
        "mitre": "T1059",
        "version": "-"
    },
    {
        "id": "malware",
        "name": "Malware",
        "enabled": False,
        "severity": "Critical",
        "mitre": "T1204",
        "version": "-"
    }
]