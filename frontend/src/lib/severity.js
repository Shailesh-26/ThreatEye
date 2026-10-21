// One place for severity colours, so every page shows the same meaning.
export const SEVERITY = {
    Critical: { color: "#ff5c5c", text: "text-sev-critical", bg: "bg-sev-critical", rank: 4 },
    High: { color: "#ff9a3d", text: "text-sev-high", bg: "bg-sev-high", rank: 3 },
    Medium: { color: "#e9c84b", text: "text-sev-medium", bg: "bg-sev-medium", rank: 2 },
    Low: { color: "#5da8ff", text: "text-sev-low", bg: "bg-sev-low", rank: 1 },
};

export function severityOf(level) {
    return SEVERITY[level] ?? SEVERITY.Low;
}
