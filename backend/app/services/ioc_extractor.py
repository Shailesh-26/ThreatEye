"""
IOC = Indicator of Compromise: a concrete value (IP, domain, URL, email,
file hash) that an analyst can search for elsewhere or block.

Only fields that can contain such values are scanned (see
build_searchable_text) so words like 'login' or SQL keywords are not
mistaken for hostnames.
"""

import re

OCTET = r"(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)"

# Things that look like "name.ext" but are files, not domains.
FILE_EXTENSIONS = {
    "php", "html", "htm", "js", "css", "jsp", "asp", "aspx", "png", "jpg",
    "jpeg", "gif", "svg", "ico", "txt", "csv", "json", "xml", "exe", "dll",
    "zip", "pdf", "sh", "py", "bak", "log", "cgi",
}


class IOCExtractor:

    IPV4_REGEX = re.compile(rf"(?<![\d.]){OCTET}(?:\.{OCTET}){{3}}(?![\d.])")
    URL_REGEX = re.compile(r"https?://[^\s'\"<>]+")
    EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
    DOMAIN_REGEX = re.compile(r"\b(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}\b")
    MD5_REGEX = re.compile(r"\b[a-fA-F0-9]{32}\b")
    SHA1_REGEX = re.compile(r"\b[a-fA-F0-9]{40}\b")
    SHA256_REGEX = re.compile(r"\b[a-fA-F0-9]{64}\b")

    SEARCH_FIELDS = [
        "source_ip",
        "destination_ip",
        "url",
        "payload",
        "message",
        "hostname",
        "command",
        "query",
        "email",
        "user_agent",
    ]

    @classmethod
    def build_searchable_text(cls, log: dict) -> str:
        return " ".join(
            str(log[field]) for field in cls.SEARCH_FIELDS if log.get(field)
        )

    @classmethod
    def extract(cls, text: str) -> dict:
        text = text or ""

        emails = set(cls.EMAIL_REGEX.findall(text))
        email_domains = {email.split("@", 1)[1].lower() for email in emails}

        domains = set()
        for match in cls.DOMAIN_REGEX.findall(text):
            tld = match.rsplit(".", 1)[-1].lower()
            if tld in FILE_EXTENSIONS:
                continue
            domains.add(match.lower())
        domains -= email_domains

        return {
            "ips": sorted(set(cls.IPV4_REGEX.findall(text))),
            "domains": sorted(domains),
            "urls": sorted({url.rstrip(".,;)") for url in cls.URL_REGEX.findall(text)}),
            "emails": sorted(emails),
            "hashes": sorted(set(
                cls.MD5_REGEX.findall(text)
                + cls.SHA1_REGEX.findall(text)
                + cls.SHA256_REGEX.findall(text)
            )),
            # Kept for the current UI; same values as domains for now.
            "hostnames": sorted(domains),
        }
