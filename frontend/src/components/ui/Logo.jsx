/**
 * ThreatEye mark: a scope aperture with a signal trace that spikes where
 * something abnormal happens.
 */
export function LogoMark({ size = 28, className = "" }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            className={className}
        >
            <circle cx="16" cy="16" r="13" stroke="#2c403a" strokeWidth="2" />
            <circle cx="16" cy="16" r="13" stroke="#6ee7a0" strokeWidth="2" strokeDasharray="20 62" strokeLinecap="round" transform="rotate(-120 16 16)" />
            <path
                d="M4 16h7.5l2-4.5 3 10 2.5-8 1.5 2.5H28"
                stroke="#6ee7a0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function Logo({ size = 28, showWordmark = true }) {
    return (
        <span className="inline-flex items-center gap-2.5">
            <LogoMark size={size} />
            {showWordmark && (
                <span className="font-display text-[19px] font-semibold tracking-[0.01em] text-readout">
                    ThreatEye
                </span>
            )}
        </span>
    );
}
