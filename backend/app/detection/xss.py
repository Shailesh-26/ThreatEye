"""
Cross-site scripting (XSS): request data containing HTML/JavaScript an
attacker would inject into a page, e.g. <script>, onerror=, javascript:.

A normal <img src="/logo.png"> is NOT flagged - only tags with event
handlers or script are.
"""

import re

from app.detection.base import PatternDetector

I = re.IGNORECASE


class XSSDetector(PatternDetector):
    id = "xss"
    name = "Cross Site Scripting"
    title = "Cross Site Scripting"
    event = "XSS Attack"
    icon = "shield"
    version = "2.0.0"
    description = "Regex rules for script tags, event handlers and JavaScript URLs in request data."

    PATTERNS = [
        ("Script tag", re.compile(r"<\s*script\b", I)),
        ("Event handler attribute (onerror=)", re.compile(r"<[^>]*\bon(?:error|load|click|mouseover|focus|mouseenter)\s*=", I)),
        ("JavaScript URI", re.compile(r"javascript\s*:", I)),
        ("Cookie / DOM access", re.compile(r"document\.(?:cookie|location|domain)|window\.location", I)),
        ("Dangerous JS function", re.compile(r"\b(?:alert|prompt|confirm|eval)\s*\(|String\.fromCharCode", I)),
        ("Embedded frame/object", re.compile(r"<\s*(?:iframe|object|embed)\b", I)),
    ]

    SEARCH_FIELDS = ["url", "payload", "query", "request", "message"]
