// Timestamps from logs look like "2026-10-15 16:32:00" or "2026-10-15T16:32:00".
export function toDate(value) {
    if (!value) return null;
    const date = new Date(String(value).replace(" ", "T"));
    return Number.isNaN(date.getTime()) ? null : date;
}

export function timeOf(value) {
    const d = toDate(value);
    return d ? d.toLocaleTimeString("en-GB", { hour12: false }) : "";
}

export function dateOf(value) {
    const d = toDate(value);
    return d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
}

export function hourMinute(value) {
    const d = toDate(value);
    return d ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";
}

/** "+12 s", "+3 min", "+1 h 05 min" */
export function gap(seconds) {
    if (seconds < 60) return `+${Math.round(seconds)} s`;
    if (seconds < 3600) return `+${Math.round(seconds / 60)} min`;
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return `+${h} h ${String(m).padStart(2, "0")} min`;
}

export function plural(n, word) {
    return `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;
}

export const humanize = (text) => String(text ?? "").replaceAll("_", " ");

/** Link to the technique on attack.mitre.org (T1059.007 -> /techniques/T1059/007/). */
export function mitreUrl(id) {
    if (!id || id === "Unknown") return null;
    return `https://attack.mitre.org/techniques/${id.replace(".", "/")}/`;
}

/** Local "YYYY-MM-DDTHH:MM:SS" (no timezone), matching how log timestamps are written. */
export function localIso(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
