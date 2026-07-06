import re


class IOCExtractor:

    IPV4_REGEX = re.compile(
        r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
    )

    URL_REGEX = re.compile(
        r"https?://[^\s]+"
    )

    EMAIL_REGEX = re.compile(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
    )

    DOMAIN_REGEX = re.compile(
        r"\b(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}\b"
    )

    MD5_REGEX = re.compile(
        r"\b[a-fA-F0-9]{32}\b"
    )

    SHA1_REGEX = re.compile(
        r"\b[a-fA-F0-9]{40}\b"
    )

    SHA256_REGEX = re.compile(
        r"\b[a-fA-F0-9]{64}\b"
    )

    HOSTNAME_REGEX = re.compile(
    r"\b(?:[A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,}\b"
    )

    RESERVED_WORDS = {
        "login",
        "failed",
        "success",
        "detected",
        "critical",
        "medium",
        "high",
        "low",
        "warning",
        "alert",
        "event",
        "port",
        "scan",
        "authentication",
        "reconnaissance",
        "status",
        "active",
        "timestamp"
    }
    @classmethod
    def build_searchable_text(cls, log: dict) -> str:
        fields = [
            "source_ip",
            "destination_ip",
            "url",
            "payload",
            "message",
            "hostname",
            "command",
            "query",
            "email",
            "user_agent"
        ]

        return " ".join(
            str(log.get(field, ""))
            for field in fields
            if log.get(field)
        )
    @classmethod
    def extract(
        cls,
        text: str
    ):
        text = text or ""

        ips = sorted(
            set(
                cls.IPV4_REGEX.findall(text)
            )
        )

        urls = sorted(
            set(
                cls.URL_REGEX.findall(text)
            )
        )

        emails = sorted(
            set(
                cls.EMAIL_REGEX.findall(text)
            )
        )

        domains = sorted(
            set(
                cls.DOMAIN_REGEX.findall(text)
            )
        )

        hashes = sorted(
            set(
                cls.MD5_REGEX.findall(text)
                + cls.SHA1_REGEX.findall(text)
                + cls.SHA256_REGEX.findall(text)
            )
        )

        hostnames = domains.copy()

        hostnames = sorted(set(hostnames))

        return {
            "ips": ips,
            "domains": domains,
            "urls": urls,
            "emails": emails,
            "hashes": hashes,
            "hostnames": hostnames
        }