import { severityOf } from "../../lib/severity";

export function SeverityMark({ level, size = 8 }) {
    return (
        <span
            aria-hidden="true"
            className="inline-block shrink-0 rotate-45"
            style={{ width: size, height: size, background: severityOf(level).color }}
        />
    );
}

export default function SeverityBadge({ level }) {
    const sev = severityOf(level);
    return (
        <span className={`inline-flex items-center gap-2 text-sm font-medium ${sev.text}`}>
            <SeverityMark level={level} />
            {level}
        </span>
    );
}
