class EvidenceService:

    @staticmethod
    def build(entries, patterns):

        evidence = []

        affected_assets = set()

        matched_patterns = set()

        timeline = []

        for entry in entries:

            text = " ".join(
                str(value)
                for value in entry.values()
                if value is not None
            )

            matched = []

            for pattern in patterns:

                if pattern.search(text):
                    matched.append(pattern.pattern)
                    matched_patterns.add(pattern.pattern)

            if not matched:
                continue

            asset = (
                entry.get("url")
                or entry.get("endpoint")
                or entry.get("path")
            )

            if asset:
                affected_assets.add(asset)

            evidence.append({
                "timestamp": entry.get("timestamp"),

                "payload":
                    entry.get("payload")
                    or entry.get("message")
                    or "",

                "url": asset,

                "patterns": matched
            })

            timeline.append({
                "timestamp": entry.get("timestamp"),
                "event": entry.get("event_type"),
                "source_ip": entry.get("source_ip")
            })

        evidence.sort(
            key=lambda x: x["timestamp"] or ""
        )

        timeline.sort(
            key=lambda x: x["timestamp"] or ""
        )

        return {
            "evidence": evidence,
            "matched_patterns": sorted(matched_patterns),
            "affected_assets": sorted(affected_assets),
            "timeline": timeline
        }