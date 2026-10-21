import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";

import day from "../../data/sampleDay.json";
import { severityOf } from "../../lib/severity";

/*
  Plays back a real sample dataset (datasets/05_mixed_soc_day.csv) on a
  scope-style timeline. Events and alerts come from sampleDay.json, which
  backend/tools/export_landing_replay.py generates by running the real
  detectors - nothing here is invented.

  mode="full"     interactive: play/pause, speed, drag to scrub, hover events
  mode="ambient"  decorative background loop (login page), not interactive
*/

const LANES = [
    { id: "auth", label: "Logins" },
    { id: "network", label: "Network" },
    { id: "web", label: "Web requests" },
];

const AXIS_H = 26;      // hour labels
const SIGNAL_H = 64;    // activity trace
const LANE_H = 40;
const PAD_B = 10;
const HEIGHT = AXIS_H + SIGNAL_H + LANES.length * LANE_H + PAD_B;

const DAY_SECONDS_PER_SECOND = { 1: 900, 4: 3600 }; // 1x plays the day in 40 s
const BUCKET = 300; // 5-minute buckets for the activity trace

const laneTop = (laneId) =>
    AXIS_H + SIGNAL_H + LANES.findIndex((lane) => lane.id === laneId) * LANE_H;

function clock(seconds) {
    const total = day.start_hour * 3600 + Math.max(0, Math.round(seconds));
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
}

function useWidth(ref) {
    const [width, setWidth] = useState(800);
    useEffect(() => {
        const node = ref.current;
        if (!node) return undefined;
        const observer = new ResizeObserver(([entry]) => {
            setWidth(Math.max(280, entry.contentRect.width));
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, [ref]);
    return width;
}

const buckets = (() => {
    const counts = new Array(Math.ceil(day.duration / BUCKET)).fill(0);
    for (const event of day.events) {
        counts[Math.min(counts.length - 1, Math.floor(event.t / BUCKET))] += 1;
    }
    return counts;
})();
const maxBucket = Math.max(...buckets);

export default function ReplayScope({ mode = "full" }) {
    const ambient = mode === "ambient";
    const reduceMotion = useReducedMotion();

    const wrapRef = useRef(null);
    const svgRef = useRef(null);
    const width = useWidth(wrapRef);

    const [time, setTime] = useState(() => (reduceMotion && !ambient ? day.duration : 0));
    const [playing, setPlaying] = useState(ambient && !reduceMotion);
    const [speed, setSpeed] = useState(1);
    const [hover, setHover] = useState(null);
    const [focused, setFocused] = useState(null);
    const scrubbing = useRef(false);

    const x = useCallback((t) => (t / day.duration) * width, [width]);

    // Start the full replay the first time it scrolls into view.
    useEffect(() => {
        if (ambient || reduceMotion || !wrapRef.current) return undefined;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setPlaying(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.4 }
        );
        observer.observe(wrapRef.current);
        return () => observer.disconnect();
    }, [ambient, reduceMotion]);

    // Advance the playhead.
    useEffect(() => {
        if (!playing) return undefined;
        let frame;
        let last = performance.now();
        const rate = ambient ? 1500 : DAY_SECONDS_PER_SECOND[speed];

        const tick = (now) => {
            const dt = Math.max(0, (now - last) / 1000);
            last = now;
            setTime((current) => {
                const next = current + dt * rate;
                if (next >= day.duration) {
                    if (ambient) return 0;
                    setPlaying(false);
                    return day.duration;
                }
                return next;
            });
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [playing, speed, ambient]);

    const fired = useMemo(() => day.alerts.filter((alert) => alert.at <= time), [time]);
    const rowsRead = useMemo(() => day.events.filter((event) => event.t <= time).length, [time]);
    const front = focused !== null && focused < fired.length ? fired[focused] : fired[fired.length - 1];

    const trace = useMemo(() => {
        const step = width / buckets.length;
        return buckets
            .map((count, i) => {
                const px = i * step + step / 2;
                const py = AXIS_H + SIGNAL_H - 6 - (count / maxBucket) * (SIGNAL_H - 16);
                return `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
            })
            .join(" ");
    }, [width]);

    // Markers that are close together are stacked so they don't overlap.
    const markers = useMemo(() => {
        let lastX = -100;
        let level = 0;
        return day.alerts.map((alert) => {
            const px = x(alert.at);
            level = px - lastX < 22 ? level + 1 : 0;
            lastX = px;
            return { ...alert, px, py: AXIS_H + 12 + level * 16 };
        });
    }, [x]);

    const timeFromPointer = (clientX) => {
        const rect = svgRef.current.getBoundingClientRect();
        return Math.min(day.duration, Math.max(0, ((clientX - rect.left) / rect.width) * day.duration));
    };

    const onPointerDown = (e) => {
        if (ambient) return;
        scrubbing.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        setPlaying(false);
        setFocused(null);
        setTime(timeFromPointer(e.clientX));
    };

    const onPointerMove = (e) => {
        if (ambient) return;
        if (scrubbing.current) {
            setTime(timeFromPointer(e.clientX));
            return;
        }
        const rect = svgRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const lane = LANES.find((l) => py >= laneTop(l.id) && py < laneTop(l.id) + LANE_H);
        if (!lane) {
            setHover(null);
            return;
        }
        let best = null;
        let bestDistance = 8;
        for (const event of day.events) {
            if (event.lane !== lane.id || event.t > time) continue;
            const distance = Math.abs(x(event.t) - px);
            if (distance < bestDistance) {
                best = event;
                bestDistance = distance;
            }
        }
        setHover(best);
    };

    const onPointerUp = () => {
        scrubbing.current = false;
    };

    const onKeyDown = (e) => {
        if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            togglePlay();
        } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            setPlaying(false);
            const delta = (e.key === "ArrowRight" ? 1 : -1) * 900;
            setTime((t) => Math.min(day.duration, Math.max(0, t + delta)));
        } else if (e.key === "Home") {
            setTime(0);
        } else if (e.key === "End") {
            setTime(day.duration);
        }
    };

    function togglePlay() {
        if (time >= day.duration) setTime(0);
        setFocused(null);
        setPlaying((p) => !p);
    }

    function restart() {
        setFocused(null);
        setTime(0);
        setPlaying(true);
    }

    const focusAlertIndex = front ? front.index : -1;
    const hours = Array.from(
        { length: day.end_hour - day.start_hour + 1 },
        (_, i) => i
    );

    const scope = (
        <div ref={wrapRef} className="relative w-full">
            <svg
                ref={svgRef}
                width={width}
                height={HEIGHT}
                className={ambient ? "block max-w-full" : "block max-w-full cursor-crosshair touch-none"}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={() => setHover(null)}
                {...(ambient
                    ? { "aria-hidden": true }
                    : {
                        role: "slider",
                        tabIndex: 0,
                        "aria-label": "Replay position. Space plays or pauses, arrow keys move 15 minutes.",
                        "aria-valuemin": 0,
                        "aria-valuemax": day.duration,
                        "aria-valuenow": Math.round(time),
                        "aria-valuetext": clock(time),
                        onKeyDown,
                    })}
            >
                <defs>
                    <clipPath id={`played-${mode}`}>
                        <rect x="0" y="0" width={Math.max(0, x(time))} height={HEIGHT} />
                    </clipPath>
                </defs>

                {/* hour graticule */}
                {hours.map((h) => {
                    const px = x(h * 3600);
                    return (
                        <g key={h}>
                            <line x1={px} x2={px} y1={AXIS_H - 4} y2={HEIGHT - PAD_B} stroke="#1f2e29" />
                            {!ambient && h % (width < 640 ? 2 : 1) === 0 && (
                                <text
                                    x={Math.min(Math.max(px, 16), width - 16)}
                                    y={14}
                                    textAnchor="middle"
                                    className="fill-faint font-mono text-[11px]"
                                >
                                    {String(day.start_hour + h).padStart(2, "0")}:00
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* lane separators */}
                {LANES.map((lane) => (
                    <line
                        key={lane.id}
                        x1="0"
                        x2={width}
                        y1={laneTop(lane.id)}
                        y2={laneTop(lane.id)}
                        stroke="#1f2e29"
                        strokeDasharray="2 4"
                    />
                ))}

                {/* activity trace: future (faint) and played (phosphor) */}
                <path d={trace} fill="none" stroke="#6ee7a0" strokeOpacity="0.12" strokeWidth="1.5" />
                <path
                    d={trace}
                    fill="none"
                    stroke="#6ee7a0"
                    strokeWidth="1.75"
                    strokeLinejoin="round"
                    clipPath={`url(#played-${mode})`}
                />

                {/* events */}
                {day.events.map((event, i) => {
                    const reached = event.t <= time;
                    const isAttack = event.alert >= 0;
                    const color = isAttack ? severityOf(day.alerts[event.alert].severity).color : "#6ee7a0";
                    const dimmed = focusAlertIndex >= 0 && !ambient && isAttack && event.alert !== focusAlertIndex;
                    let opacity = reached ? (isAttack ? 1 : 0.32) : 0.07;
                    if (reached && dimmed) opacity = 0.3;
                    const h = isAttack ? LANE_H - 14 : LANE_H - 24;
                    return (
                        <rect
                            key={i}
                            x={x(event.t) - (isAttack ? 1 : 0.75)}
                            y={laneTop(event.lane) + (LANE_H - h) / 2}
                            width={isAttack ? 2 : 1.5}
                            height={h}
                            rx="1"
                            fill={color}
                            opacity={opacity}
                        />
                    );
                })}

                {/* alert markers */}
                {markers.map((marker) => {
                    const visible = marker.at <= time;
                    const color = severityOf(marker.severity).color;
                    return (
                        <g
                            key={marker.index}
                            opacity={visible ? 1 : 0}
                            style={{ transition: "opacity 200ms" }}
                        >
                            <line
                                x1={marker.px}
                                x2={marker.px}
                                y1={marker.py + 5}
                                y2={HEIGHT - PAD_B}
                                stroke={color}
                                strokeOpacity={marker.index === focusAlertIndex ? 0.55 : 0.2}
                            />
                            <rect
                                x={marker.px - 5}
                                y={marker.py - 5}
                                width="10"
                                height="10"
                                transform={`rotate(45 ${marker.px} ${marker.py})`}
                                fill={color}
                            />
                        </g>
                    );
                })}

                {/* playhead */}
                {time > 0 && time < day.duration && (
                    <g style={{ filter: "drop-shadow(0 0 6px rgba(110,231,160,0.55))" }}>
                        <line x1={x(time)} x2={x(time)} y1={AXIS_H - 4} y2={HEIGHT - PAD_B} stroke="#6ee7a0" strokeWidth="1.5" />
                    </g>
                )}
            </svg>

            {hover && !ambient && (
                <div
                    className="glass pointer-events-none absolute z-10 w-64 rounded-[14px] p-3 text-sm"
                    style={{
                        left: Math.min(Math.max(x(hover.t) - 128, 0), width - 256),
                        top: laneTop(hover.lane) + LANE_H + 6,
                    }}
                >
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="font-mono text-readout">{hover.ip}</span>
                        <span className="font-mono text-xs text-faint">{hover.time}</span>
                    </div>
                    <div className="mt-1 text-muted">{hover.event.replaceAll("_", " ")}</div>
                    {hover.detail && (
                        <div className="mt-2 break-all rounded-lg bg-scope/80 px-2 py-1.5 font-mono text-xs text-readout">
                            <span className="text-faint">{hover.detail.field}: </span>
                            {hover.detail.value}
                        </div>
                    )}
                    {hover.alert >= 0 && (
                        <div className={`mt-2 text-xs ${severityOf(day.alerts[hover.alert].severity).text}`}>
                            Part of: {day.alerts[hover.alert].title}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    if (ambient) {
        return (
            <div aria-hidden="true">
                <div className="mb-6 flex items-baseline gap-6">
                    <span className="font-display text-6xl font-semibold tabular-nums text-phosphor/80">{clock(time)}</span>
                    <span className="text-muted">
                        <span className="font-display text-2xl font-semibold tabular-nums text-readout">{rowsRead}</span> rows read
                    </span>
                </div>
                {scope}
                <ul className="mt-6 min-h-[180px] space-y-2">
                    {fired.map((alert) => (
                        <motion.li
                            key={alert.index}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 text-sm"
                        >
                            <span className="h-2 w-2 rotate-45" style={{ background: severityOf(alert.severity).color }} />
                            <span className="font-mono text-faint">{alert.time}</span>
                            <span className="text-readout">{alert.title}</span>
                            <span className="font-mono text-muted">{alert.ip}</span>
                        </motion.li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 rounded-[var(--radius-panel)] border border-graticule bg-bezel">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-graticule px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={togglePlay}
                            aria-label={playing ? "Pause replay" : "Play replay"}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-phosphor text-scope transition-colors hover:bg-[#8af0b4]"
                        >
                            {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                        </button>
                        <button
                            type="button"
                            onClick={restart}
                            aria-label="Restart replay"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-plate hover:text-readout"
                        >
                            <RotateCcw size={16} />
                        </button>
                        <div className="ml-1 flex rounded-full bg-scope p-0.5" role="group" aria-label="Replay speed">
                            {[1, 4].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setSpeed(s)}
                                    aria-pressed={speed === s}
                                    className={`h-8 rounded-full px-3 font-mono text-xs transition-colors ${speed === s ? "bg-plate-hi text-readout" : "text-faint hover:text-muted"}`}
                                >
                                    {s}×
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="font-display text-2xl font-semibold tabular-nums text-phosphor">
                        {clock(time)}
                    </div>

                    <div className="ml-auto flex gap-5 text-sm text-muted">
                        <span><span className="font-display text-lg font-semibold tabular-nums text-readout">{rowsRead}</span> / {day.events.length} rows read</span>
                        <span><span className="font-display text-lg font-semibold tabular-nums text-readout">{fired.length}</span> alerts</span>
                    </div>
                </div>

                <div className="flex">
                    <div className="hidden w-32 shrink-0 flex-col border-r border-graticule text-sm text-faint sm:flex" style={{ paddingTop: AXIS_H }}>
                        <div className="flex items-center px-4" style={{ height: SIGNAL_H }}>Activity</div>
                        {LANES.map((lane) => (
                            <div key={lane.id} className="flex items-center px-4" style={{ height: LANE_H }}>
                                {lane.label}
                            </div>
                        ))}
                    </div>
                    <div className="min-w-0 flex-1 px-2 sm:px-3">{scope}</div>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-graticule px-4 py-3 text-xs text-faint sm:px-5">
                    <span className="flex items-center gap-2"><span className="h-3 w-[2px] bg-phosphor/40" /> normal event</span>
                    {["Critical", "High", "Medium"].map((level) => (
                        <span key={level} className="flex items-center gap-2">
                            <span className="h-3 w-[2px]" style={{ background: severityOf(level).color }} /> {level.toLowerCase()} alert event
                        </span>
                    ))}
                    <span className="ml-auto hidden md:inline">Drag across the scope to scrub. Hover an event to inspect it.</span>
                </div>
            </div>

            <AlertStack fired={fired} front={front} onSelect={(i) => { setPlaying(false); setFocused(i); }} />
        </div>
    );
}

function AlertStack({ fired, front, onSelect }) {
    const behind = fired.filter((alert) => alert !== front).slice(-3).reverse();

    return (
        <div className="flex flex-col">
            <div className="relative h-[290px]" aria-live="polite">
                {fired.length === 0 && (
                    <div className="flex h-full items-center justify-center rounded-[var(--radius-sheet)] border border-dashed border-graticule-hi px-8 text-center text-sm text-faint">
                        Alerts appear here the moment a detector would raise them.
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {behind.map((alert, depth) => (
                        <motion.div
                            key={`b-${alert.index}`}
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: 0.55 - depth * 0.15,
                                y: -14 * (depth + 1),
                                scale: 1 - 0.05 * (depth + 1),
                                filter: `blur(${depth + 1}px)`,
                            }}
                            exit={{ opacity: 0 }}
                            className="glass absolute inset-x-0 top-6 h-[250px] rounded-[var(--radius-sheet)]"
                            style={{ zIndex: 5 - depth }}
                            aria-hidden="true"
                        />
                    ))}
                    {front && (
                        <motion.article
                            key={`f-${front.index}`}
                            initial={{ opacity: 0, y: 28, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ type: "spring", stiffness: 260, damping: 26 }}
                            className="glass absolute inset-x-0 top-6 z-10 flex h-[250px] flex-col rounded-[var(--radius-sheet)] p-5"
                        >
                            <AlertCardBody alert={front} />
                        </motion.article>
                    )}
                </AnimatePresence>
            </div>

            {fired.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {fired.map((alert, i) => (
                        <button
                            key={alert.index}
                            type="button"
                            onClick={() => onSelect(i)}
                            aria-pressed={alert === front}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${alert === front ? "border-graticule-hi bg-plate text-readout" : "border-graticule text-muted hover:border-graticule-hi"}`}
                        >
                            <span className="h-2 w-2 rotate-45" style={{ background: severityOf(alert.severity).color }} />
                            {alert.time}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function AlertCardBody({ alert }) {
    const sev = severityOf(alert.severity);
    return (
        <>
            <div className="flex items-center justify-between">
                <span className={`flex items-center gap-2 text-sm font-medium ${sev.text}`}>
                    <span className="h-2.5 w-2.5 rotate-45" style={{ background: sev.color }} />
                    {alert.severity}
                </span>
                <span className="font-mono text-xs text-faint">{alert.time}</span>
            </div>
            <h3 className="mt-3 font-display text-xl font-semibold leading-tight text-readout">{alert.title}</h3>
            <div className="mt-1 font-mono text-sm text-muted">{alert.ip}</div>
            <ul className="mt-3 space-y-1 text-sm text-muted">
                {alert.reasons.slice(0, 2).map((reason) => (
                    <li key={reason} className="line-clamp-2">{reason}</li>
                ))}
            </ul>
            <div className="mt-auto flex items-end justify-between pt-3 text-sm">
                <span className="text-faint">
                    <span className="font-mono text-muted">{alert.mitre}</span> {alert.mitre_name}
                </span>
                <span className="font-display text-2xl font-semibold tabular-nums text-readout">{alert.threat_score}</span>
            </div>
        </>
    );
}
