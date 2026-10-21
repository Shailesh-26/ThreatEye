import day from "../data/sampleDay.json";
import { SEVERITY } from "./severity";

/** Radar contacts built from the sample day (used where there's no live data, e.g. sign-in). */
export function sampleContacts() {
    const byIp = new Map();
    for (const event of day.events) {
        const entry = byIp.get(event.ip) ?? { ip: event.ip, events: 0, risk: 0, severity: null };
        entry.events += 1;
        byIp.set(event.ip, entry);
    }
    for (const alert of day.alerts) {
        const entry = byIp.get(alert.ip);
        if (!entry) continue;
        if (!entry.severity || SEVERITY[alert.severity].rank > SEVERITY[entry.severity].rank) {
            entry.severity = alert.severity;
        }
        entry.risk = Math.max(entry.risk, alert.threat_score);
        entry.label = entry.label ? `${entry.label}, ${alert.title}` : alert.title;
    }
    return [...byIp.values()];
}

/** Radar contacts from the dashboard API's `sources` list. */
export function dashboardContacts(sources = []) {
    return sources.map((s) => ({
        ip: s.ip,
        events: s.events,
        risk: s.risk,
        severity: s.max_severity,
        label: s.alerts ? `${s.alerts} alert${s.alerts === 1 ? "" : "s"}: ${s.detectors.join(", ").replaceAll("_", " ")}` : undefined,
    }));
}
