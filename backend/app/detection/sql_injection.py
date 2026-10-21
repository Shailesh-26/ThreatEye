"""
SQL injection: request data containing SQL syntax an attacker would use to
break out of a query (e.g. ' OR '1'='1, UNION SELECT, ; DROP TABLE).

Patterns are written to need SQL *structure*, not single characters, so a
URL like /docs#install or a message containing "--" is not flagged.
"""

import re

from app.detection.base import PatternDetector

I = re.IGNORECASE


class SQLInjectionDetector(PatternDetector):
    id = "sql_injection"
    name = "SQL Injection"
    title = "SQL Injection Attempt"
    event = "SQL Injection"
    icon = "database"
    version = "2.0.0"
    description = "Regex rules for SQL injection techniques in URLs, payloads and queries."

    PATTERNS = [
        ("Tautology (OR 1=1)", re.compile(r"\b(?:or|and)\s+(\d+)\s*=\s*\1\b", I)),
        ("Quoted tautology (' OR 'a'='a)", re.compile(r"'\s*(?:or|and)\s+'([^']*)'\s*=\s*'\1", I)),
        ("UNION SELECT", re.compile(r"\bunion\b(?:\s+all)?\s+select\b", I)),
        ("Stacked query (; DROP ...)", re.compile(r";\s*(?:drop|delete|insert|update|truncate|alter)\s", I)),
        ("Schema enumeration", re.compile(r"\binformation_schema\b|\bpg_catalog\b|\bsysobjects\b", I)),
        ("Time-based blind (SLEEP)", re.compile(r"\b(?:sleep|benchmark|pg_sleep)\s*\(|\bwaitfor\s+delay\b", I)),
        ("Quote followed by comment ('--)", re.compile(r"'\s*(?:--|#|/\*)")),
        ("Command execution (xp_cmdshell)", re.compile(r"\bxp_cmdshell\b", I)),
    ]

    SEARCH_FIELDS = ["url", "payload", "query", "request", "command", "message"]
