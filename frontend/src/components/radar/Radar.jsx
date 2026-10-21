import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { severityOf } from "../../lib/severity";

/*
  Radar scope. Each "contact" is a source IP:
    bearing  - fixed per IP (a hash), so an IP always appears in the same place
    distance - risk: the closer to the centre, the more dangerous
    colour   - its worst alert's severity; IPs with no alerts are faint green
  The sweep turns every PERIOD seconds and each contact flares as the sweep
  passes, then fades like phosphor on a real CRT. Both are pure CSS
  animations started together, so they stay in sync without JavaScript
  running every frame.

  props
    contacts   [{ ip, risk, severity|null, events, label? }]
    highlight  ip to lock on to (draws target brackets)
    onHover(ip|null), onSelect(ip)
    centre     node shown in the middle (defaults to a live clock)
    interactive  false for decorative use
*/

const PERIOD = 6; // seconds per revolution
const SIZE = 1000;
const C = SIZE / 2;
const R = 470;

function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    // Final mix so similar IPs (192.168.1.20 / .21) land far apart.
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
}

function place(contact) {
    const bearing = hash(contact.ip) * 360;
    const jitter = hash(`${contact.ip}#r`);
    const distance = contact.severity
        ? 0.16 + (1 - Math.min(contact.risk, 100) / 100) * 0.55 + jitter * 0.08
        : 0.74 + jitter * 0.2;
    const rad = ((bearing - 90) * Math.PI) / 180;
    return {
        ...contact,
        bearing,
        x: C + Math.cos(rad) * distance * R,
        y: C + Math.sin(rad) * distance * R,
    };
}

function sector(from, to, radius) {
    const a = ((from - 90) * Math.PI) / 180;
    const b = ((to - 90) * Math.PI) / 180;
    const large = to - from > 180 ? 1 : 0;
    return `M${C},${C} L${C + Math.cos(a) * radius},${C + Math.sin(a) * radius} A${radius},${radius} 0 ${large} 1 ${C + Math.cos(b) * radius},${C + Math.sin(b) * radius} Z`;
}

function LiveClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return now.toLocaleTimeString("en-GB", { hour12: false });
}

export default function Radar({
    contacts = [],
    highlight = null,
    onHover,
    onSelect,
    centre,
    interactive = true,
    className = "",
}) {
    const reduceMotion = useReducedMotion();
    const placed = useMemo(() => contacts.map(place), [contacts]);
    const [hovered, setHovered] = useState(null);
    const active = highlight ?? hovered;

    const setHover = (ip) => {
        setHovered(ip);
        onHover?.(ip);
    };

    // Afterglow behind the sweep: thin slices fading out (no gradient).
    const trail = Array.from({ length: 14 }, (_, i) => ({
        d: sector(-(i + 1) * 3.2, -i * 3.2, R),
        opacity: 0.22 * (1 - i / 14),
    }));

    const animated = !reduceMotion;
    const activeContact = placed.find((c) => c.ip === active);

    return (
        <div className={`relative aspect-square w-full ${className}`}>
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full" role={interactive ? "group" : undefined} aria-label={interactive ? "Radar of source IPs" : undefined} aria-hidden={interactive ? undefined : true}>
                <defs>
                    <clipPath id="radar-disc">
                        <circle cx={C} cy={C} r={R} />
                    </clipPath>
                </defs>

                <circle cx={C} cy={C} r={R} fill="#0a1310" stroke="#2c403a" strokeWidth="2" />

                {/* range rings and crosshair */}
                {[0.25, 0.5, 0.75].map((f) => (
                    <circle key={f} cx={C} cy={C} r={R * f} fill="none" stroke="#1f2e29" strokeWidth="1.5" strokeDasharray={f === 0.5 ? "none" : "4 8"} />
                ))}
                <line x1={C - R} x2={C + R} y1={C} y2={C} stroke="#1f2e29" strokeWidth="1.5" />
                <line x1={C} x2={C} y1={C - R} y2={C + R} stroke="#1f2e29" strokeWidth="1.5" />

                {/* bearing ticks */}
                {Array.from({ length: 72 }, (_, i) => {
                    const deg = i * 5;
                    const rad = ((deg - 90) * Math.PI) / 180;
                    const inner = R - (deg % 30 === 0 ? 22 : deg % 10 === 0 ? 14 : 8);
                    return (
                        <line
                            key={deg}
                            x1={C + Math.cos(rad) * inner}
                            y1={C + Math.sin(rad) * inner}
                            x2={C + Math.cos(rad) * R}
                            y2={C + Math.sin(rad) * R}
                            stroke={deg % 30 === 0 ? "#3f5a51" : "#24352f"}
                            strokeWidth={deg % 30 === 0 ? 2.5 : 1.5}
                        />
                    );
                })}
                {interactive && Array.from({ length: 12 }, (_, i) => {
                    const deg = i * 30;
                    const rad = ((deg - 90) * Math.PI) / 180;
                    return (
                        <text
                            key={deg}
                            x={C + Math.cos(rad) * (R - 44)}
                            y={C + Math.sin(rad) * (R - 44) + 8}
                            textAnchor="middle"
                            className="fill-faint font-mono"
                            style={{ fontSize: 22 }}
                        >
                            {String(deg).padStart(3, "0")}
                        </text>
                    );
                })}

                {/* sweep */}
                <g clipPath="url(#radar-disc)">
                    <g
                        style={{
                            transformOrigin: `${C}px ${C}px`,
                            animation: animated ? `radar-sweep ${PERIOD}s linear infinite` : "none",
                            transform: animated ? undefined : "rotate(40deg)",
                        }}
                    >
                        {trail.map((slice, i) => (
                            <path key={i} d={slice.d} fill="#6ee7a0" opacity={slice.opacity} />
                        ))}
                        <line x1={C} y1={C} x2={C} y2={C - R} stroke="#6ee7a0" strokeWidth="3" />
                    </g>
                </g>

                {/* contacts */}
                {placed.map((c) => {
                    const color = c.severity ? severityOf(c.severity).color : "#6ee7a0";
                    const delay = -(PERIOD - (c.bearing / 360) * PERIOD);
                    const radius = c.severity ? 9 + Math.min(c.risk, 100) / 12 : 6;
                    const isActive = c.ip === active;
                    return (
                        <g
                            key={c.ip}
                            onPointerEnter={interactive ? () => setHover(c.ip) : undefined}
                            onPointerLeave={interactive ? () => setHover(null) : undefined}
                            onFocus={interactive ? () => setHover(c.ip) : undefined}
                            onBlur={interactive ? () => setHover(null) : undefined}
                            onClick={interactive && onSelect ? () => onSelect(c.ip) : undefined}
                            onKeyDown={interactive && onSelect ? (e) => (e.key === "Enter" || e.key === " ") && onSelect(c.ip) : undefined}
                            tabIndex={interactive ? 0 : undefined}
                            role={interactive ? "button" : undefined}
                            aria-label={interactive ? `${c.ip}${c.severity ? `, ${c.severity}` : ", no alerts"}` : undefined}
                            className={interactive ? "cursor-pointer outline-none" : undefined}
                        >
                            {/* larger invisible hit area */}
                            {interactive && <circle cx={c.x} cy={c.y} r={radius + 16} fill="transparent" />}
                            <circle
                                cx={c.x}
                                cy={c.y}
                                r={radius}
                                fill={color}
                                style={{
                                    transformOrigin: `${c.x}px ${c.y}px`,
                                    animation: animated ? `radar-blip ${PERIOD}s linear ${delay}s infinite` : "none",
                                    opacity: animated ? undefined : c.severity ? 0.95 : 0.4,
                                }}
                            />
                            {c.severity === "Critical" && animated && (
                                <circle
                                    cx={c.x}
                                    cy={c.y}
                                    r={radius}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth="2.5"
                                    style={{
                                        transformOrigin: `${c.x}px ${c.y}px`,
                                        animation: `radar-ping ${PERIOD}s ease-out ${delay}s infinite`,
                                    }}
                                />
                            )}
                            {isActive && (
                                <g stroke={color} strokeWidth="3" fill="none">
                                    {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
                                        const o = radius + 14;
                                        const l = 12;
                                        return (
                                            <path
                                                key={`${sx}${sy}`}
                                                d={`M${c.x + sx * o},${c.y + sy * (o - l)} L${c.x + sx * o},${c.y + sy * o} L${c.x + sx * (o - l)},${c.y + sy * o}`}
                                            />
                                        );
                                    })}
                                </g>
                            )}
                        </g>
                    );
                })}

                <circle cx={C} cy={C} r="5" fill="#6ee7a0" />
            </svg>

            {/* centre readout */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="mt-[34%] text-center">
                    {centre ?? (
                        <span className="font-display text-[clamp(18px,3.2vw,30px)] font-semibold tabular-nums text-phosphor/90">
                            <LiveClock />
                        </span>
                    )}
                </div>
            </div>

            {interactive && activeContact && (
                <div
                    className="glass pointer-events-none absolute z-10 w-56 rounded-[14px] p-3 text-sm"
                    style={{
                        left: `clamp(0px, calc(${(activeContact.x / SIZE) * 100}% - 112px), calc(100% - 224px))`,
                        top: `calc(${(activeContact.y / SIZE) * 100}% + 18px)`,
                    }}
                >
                    <div className="font-mono text-readout">{activeContact.ip}</div>
                    <div className="mt-1 text-muted">
                        {activeContact.events} event{activeContact.events === 1 ? "" : "s"}
                        {activeContact.severity ? `, worst alert ${activeContact.severity.toLowerCase()}` : ", no alerts"}
                    </div>
                    {activeContact.label && <div className="mt-1 text-faint">{activeContact.label}</div>}
                </div>
            )}
        </div>
    );
}
