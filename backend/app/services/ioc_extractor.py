import re


class IOCExtractor:

    IPV4_REGEX = re.compile(
        r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
    )

    DOMAIN_REGEX = re.compile(
        r"\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b"
    )

    URL_REGEX = re.compile(
        r"https?://[^\s]+"
    )

    EMAIL_REGEX = re.compile(
        r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b"
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
        r"\b[a-zA-Z0-9][a-zA-Z0-9-]{0,62}\b"
    )

    @classmethod
    def extract(cls, text: str):

        text = text or ""

        return {

            "ips": sorted(
                set(
                    cls.IPV4_REGEX.findall(text)
                )
            ),

            "domains": sorted(
                set(
                    cls.DOMAIN_REGEX.findall(text)
                )
            ),

            "urls": sorted(
                set(
                    cls.URL_REGEX.findall(text)
                )
            ),

            "emails": sorted(
                set(
                    cls.EMAIL_REGEX.findall(text)
                )
            ),

            "hashes": sorted(
                set(
                    cls.MD5_REGEX.findall(text)
                    + cls.SHA1_REGEX.findall(text)
                    + cls.SHA256_REGEX.findall(text)
                )
            ),

            "hostnames": sorted(
                set(
                    cls.HOSTNAME_REGEX.findall(text)
                )
            )

        }