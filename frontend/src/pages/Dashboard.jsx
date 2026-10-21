import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { toast } from "sonner";

import Radar from "../components/radar/Radar";
import Button from "../components/ui/Button";
import CountUp from "../components/ui/CountUp";
import SeverityBadge, { SeverityMark } from "../components/ui/SeverityBadge";
import Skeleton from "../components/ui/Skeleton";
import Tile from "../components/ui/Tile";
import useData from "../hooks/useData";
import { dashboardContacts } from "../lib/contacts";
import { dateOf, hourMinute, humanize, localIso, plural, timeOf, toDate } from "../lib/format";
import { SEVERITY, severityOf } from "../lib/severity";
import { getDashboard } from "../services/dashboardService";
import { runDetectionRule } from "../services/detectionService";
import { loadSample } from "../services/logService";

const LEVELS = ["Critical", "High", "Medium", "Low"];

// ---- Activity over time -----------------------------------------------
function DayTrace({ timeline }) {
    const navigate = useNavigate();
    const [hover, setHover] = useState(null);
    const buckets = timeline.buckets;
    const max = Math.max(1, ...buckets.map((b) => b.events));
    const minutes = timeline.bucket_seconds / 60;

    const openRange = (bucket) => {
        const end = new Date(toDate(bucket.start).getTime() + timeline.bucket_seconds * 1000);
        navigate(`/logs?from=${encodeURIComponent(bucket.start)}&to=${encodeURIComponent(localIso(end))}`);
    };

    // Axis labels: about 6 evenly spaced.
    const every = Math.max(1, Math.round(buckets.length / 6));

    return (
        <div>
            <div className="relative h-44" onPointerLeave={() => setHover(null)}>
                <div className="absolute inset-0 flex items-end gap-[2px]">
                    {buckets.map((bucket, i) => {
                        const worst = bucket.alerts.reduce(
                            (w, a) => (!w || SEVERITY[a.severity].rank > SEVERITY[w].rank ? a.severity : w),
                            null
                        );
                        return (
                            <button
                                key={bucket.start}
                                type="button"
                                onPointerEnter={() => setHover(i)}
                                onFocus={() => setHover(i)}
                                onClick={() => openRange(bucket)}
                                aria-label={`${hourMinute(bucket.start)}: ${plural(bucket.events, "event")}${bucket.alerts.length ? `, ${plural(bucket.alerts.length, "alert")}` : ""}. Open these rows in Logs.`}
                                className="group relative flex h-full min-w-0 flex-1 flex-col justify-end"
                            >
                                {worst && (
                                    <span
                                        className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rotate-45"
                                        style={{ background: severityOf(worst).color }}
                                    />
                                )}
                                <motion.span
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: 1 }}
                                    transition={{ duration: 0.5, delay: i * 0.006, ease: "easeOut" }}
                                    style={{
                                        height: `${Math.max(3, (bucket.events / max) * 82)}%`,
                                        transformOrigin: "bottom",
                                        background: worst ? severityOf(worst).color : undefined,
                                    }}
                                    className={`block w-full rounded-t-[2px] transition-opacity ${worst ? "" : "bg-phosphor/45 group-hover:bg-phosphor"} ${hover !== null && hover !== i ? "opacity-50" : ""}`}
                                />
                            </button>
                        );
                    })}
                </div>

                {hover !== null && (
                    <div
                        className="glass pointer-events-none absolute top-0 z-10 w-52 rounded-[12px] p-3 text-sm"
                        style={{ left: `clamp(0px, calc(${((hover + 0.5) / buckets.length) * 100}% - 104px), calc(100% - 208px))` }}
                    >
                        <div className="font-mono text-readout">
                            {hourMinute(buckets[hover].start)} + {minutes} min
                        </div>
                        <div className="mt-1 text-muted">{plural(buckets[hover].events, "event")}</div>
                        {buckets[hover].alerts.map((a) => (
                            <div key={a.id} className={`mt-1 ${severityOf(a.severity).text}`}>{a.id} ends here</div>
                        ))}
                        <div className="mt-2 text-xs text-faint">Click to open these rows in Logs</div>
                    </div>
                )}
            </div>
            <div className="mt-2 flex justify-between font-mono text-xs text-faint">
                {buckets.filter((_, i) => i % every === 0).map((b) => (
                    <span key={b.start}>{hourMinute(b.start)}</span>
                ))}
            </div>
        </div>
    );
}

// ---- Severity breakdown -------------------------------------------------
function EventTypes({ types, total }) {
    return (
        <div className="mt-6 border-t border-graticule pt-4">
            <h3 className="text-sm text-muted">Most common events</h3>
            <ul className="mt-3 space-y-2">
                {types.slice(0, 5).map((t) => (
                    <li key={t.type}>
                        <Link to={`/logs?event=${encodeURIComponent(t.type)}`} className="group grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm">
                            <span className="text-readout group-hover:text-phosphor">{humanize(t.type)}</span>
                            <span className="tabular-nums text-faint">{t.count}</span>
                            <span className="col-span-2 h-1 overflow-hidden rounded-full bg-scope">
                                <motion.span className="block h-full rounded-full bg-phosphor/50" initial={{ width: 0 }} animate={{ width: `${(t.count / total) * 100}%` }} transition={{ duration: 0.7, ease: "easeOut" }} />
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function SeverityBar({ counts, total }) {
    return (
        <div>
            <div className="flex h-4 overflow-hidden rounded-full bg-scope">
                {LEVELS.filter((l) => counts[l]).map((level) => (
                    <Link
                        key={level}
                        to={`/alerts?severity=${level}`}
                        title={`${counts[level]} ${level}`}
                        className="h-full transition-[filter] hover:brightness-125"
                        style={{ width: `${(counts[level] / total) * 100}%`, background: severityOf(level).color }}
                    />
                ))}
            </div>
            <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
                {LEVELS.map((level) => (
                    <li key={level}>
                        <Link
                            to={`/alerts?severity=${level}`}
                            className={`flex items-baseline justify-between rounded-[10px] px-2 py-1 transition-colors hover:bg-plate ${counts[level] ? "" : "pointer-events-none opacity-40"}`}
                        >
                            <SeverityBadge level={level} />
                            <span className="font-display text-2xl font-semibold tabular-nums text-readout">{counts[level]}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ---- Sources list (linked to the radar) --------------------------------
function Sources({ sources, focusIp, setFocusIp }) {
    const attackers = sources.filter((s) => s.alerts > 0);
    const quiet = sources.length - attackers.length;
    return (
        <div>
            <ul className="space-y-1">
                {attackers.map((s) => (
                    <li key={s.ip}>
                        <Link
                            to={`/alerts?ip=${s.ip}`}
                            onPointerEnter={() => setFocusIp(s.ip)}
                            onPointerLeave={() => setFocusIp(null)}
                            onFocus={() => setFocusIp(s.ip)}
                            onBlur={() => setFocusIp(null)}
                            className={`grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 rounded-[12px] px-3 py-2.5 transition-colors ${focusIp === s.ip ? "bg-plate" : "hover:bg-plate/60"}`}
                        >
                            <span className="flex items-center gap-2.5 font-mono text-readout">
                                <SeverityMark level={s.max_severity} />
                                {s.ip}
                            </span>
                            <span className="font-display text-lg font-semibold tabular-nums text-readout">{s.risk}</span>
                            <span className="col-span-2 flex items-center gap-3">
                                <span className="h-1 flex-1 overflow-hidden rounded-full bg-scope">
                                    <motion.span
                                        className="block h-full rounded-full"
                                        style={{ background: severityOf(s.max_severity).color }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${s.risk}%` }}
                                        transition={{ duration: 0.7, ease: "easeOut" }}
                                    />
                                </span>
                                <span className="text-xs text-faint">{s.detectors.map(humanize).join(", ")}</span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
            {quiet > 0 && (
                <p className="mt-3 px-3 text-sm text-faint">
                    {plural(quiet, "other source")} with no alerts appear as faint contacts on the radar.
                </p>
            )}
        </div>
    );
}

// ---- Detector tiles --------------------------------------------------------
function Detectors({ detectors }) {
    const [running, setRunning] = useState(null);

    async function run(detector) {
        setRunning(detector.id);
        try {
            const result = await runDetectionRule(detector.id);
            toast.success(`${detector.name} ran on the loaded logs`, {
                description: result.alerts
                    ? `${plural(result.alerts, "alert")}: ${result.results.map((a) => a.source_ip).join(", ")}`
                    : "No alerts. Nothing matched this rule.",
            });
        } catch (error) {
            toast.error(`${detector.name} didn't run`, { description: error?.response?.data?.detail ?? "The server didn't respond." });
        } finally {
            setRunning(null);
        }
    }

    return (
        <ul className="divide-y divide-graticule">
            {detectors.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="flex-1 text-readout">{d.name}</span>
                    <span className={`font-display text-xl font-semibold tabular-nums ${d.alerts ? "text-readout" : "text-faint"}`}>{d.alerts}</span>
                    <button
                        type="button"
                        onClick={() => run(d)}
                        disabled={running === d.id}
                        aria-label={`Run ${d.name} now`}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-graticule-hi text-muted transition-colors hover:border-phosphor/60 hover:text-phosphor disabled:opacity-50"
                    >
                        <Play size={13} fill="currentColor" />
                    </button>
                </li>
            ))}
        </ul>
    );
}

// ---- Empty state -------------------------------------------------------------
function NoData({ onLoaded }) {
    const [busy, setBusy] = useState(false);

    async function loadDemo() {
        setBusy(true);
        try {
            const result = await loadSample("05_mixed_soc_day.csv");
            toast.success("Sample day loaded", { description: `${plural(result.count, "row")}, ${plural(result.alerts, "alert")}.` });
            onLoaded();
        } catch (error) {
            toast.error("The sample couldn't be loaded", { description: error?.response?.data?.detail ?? "The server didn't respond." });
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="grid items-center gap-10 rounded-[var(--radius-panel)] border border-graticule bg-bezel p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div>
                <h2 className="font-display text-4xl font-semibold text-readout">No logs loaded yet</h2>
                <p className="mt-3 max-w-[52ch] text-muted">
                    The radar fills up once there's something to analyse. Upload your own file, or load the mixed sample
                    day: 134 rows with a port scan, two brute-force attacks, SQL injection and XSS hidden in normal traffic.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Button variant="primary" size="lg" onClick={loadDemo} disabled={busy}>
                        {busy ? "Loading sample" : "Load the sample day"}
                    </Button>
                    <Button to="/logs" size="lg">Upload a file</Button>
                </div>
            </div>
            <Radar contacts={[]} interactive={false} />
        </div>
    );
}

// ---- Page ----------------------------------------------------------------------
export default function Dashboard() {
    const { data, error, loading, reload } = useData(getDashboard);
    const [focusIp, setFocusIp] = useState(null);
    const navigate = useNavigate();
    const contacts = useMemo(() => dashboardContacts(data?.sources), [data]);

    if (loading && !data) {
        return (
            <div className="grid gap-4 lg:grid-cols-12">
                <Skeleton className="h-[520px] lg:col-span-5" />
                <div className="grid gap-4 lg:col-span-7">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <Tile title="The dashboard couldn't load">
                <p className="text-muted">
                    {error?.response?.data?.detail ?? "The server didn't respond. Check that the backend is running on port 8000."}
                </p>
                <Button className="mt-4" onClick={reload}>Try again</Button>
            </Tile>
        );
    }

    if (!data.total_logs) return <NoData onLoaded={reload} />;

    const openIp = (ip) => {
        const source = data.sources.find((s) => s.ip === ip);
        navigate(source?.alerts ? `/alerts?ip=${ip}` : `/logs?q=${ip}`);
    };

    const span = data.timeline;
    const attackers = data.sources.filter((s) => s.alerts).length;

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-12">
            <Tile
                className="lg:col-span-5 lg:row-span-2"
                title="Sources by risk"
                action={<span className="text-sm text-faint">Closer to the centre means higher risk</span>}
            >
                <Radar
                    contacts={contacts}
                    highlight={focusIp}
                    onHover={setFocusIp}
                    onSelect={openIp}
                    centre={
                        <div className="leading-tight">
                            <div className="font-display text-4xl font-semibold tabular-nums text-readout">{attackers}</div>
                            <div className="text-sm text-muted">attacking IP{attackers === 1 ? "" : "s"}</div>
                        </div>
                    }
                />
                <p className="mt-3 text-sm text-faint">Click a contact to open its alerts. Faint green contacts raised none.</p>
            </Tile>

            <Tile className="lg:col-span-7" bodyClassName="pt-4">
                <div className="flex flex-wrap items-end gap-x-10 gap-y-5">
                    <div>
                        <div className="text-sm text-muted">Alerts</div>
                        <Link to="/alerts" className="font-display text-6xl font-semibold leading-none text-readout hover:text-phosphor">
                            <CountUp value={data.total_alerts} />
                        </Link>
                    </div>
                    <div>
                        <div className="text-sm text-muted">Rows analysed</div>
                        <CountUp value={data.total_logs} className="font-display text-4xl font-semibold text-readout" />
                    </div>
                    <div>
                        <div className="text-sm text-muted">Source IPs</div>
                        <CountUp value={data.unique_source_ips} className="font-display text-4xl font-semibold text-readout" />
                    </div>
                    <div>
                        <div className="text-sm text-muted">Failed logins</div>
                        <CountUp value={data.failed_logins} className="font-display text-4xl font-semibold text-readout" />
                    </div>
                    {span && (
                        <div className="ml-auto text-right text-sm text-faint">
                            <div>{dateOf(span.first)}</div>
                            <div className="font-mono">{timeOf(span.first)} to {timeOf(span.last)}</div>
                        </div>
                    )}
                </div>
            </Tile>

            {span && (
                <Tile
                    className="lg:col-span-7"
                    title="Activity"
                    action={<span className="text-sm text-faint">{span.bucket_seconds / 60}-minute bars. Diamonds mark where an alert ends.</span>}
                >
                    <DayTrace timeline={span} />
                </Tile>
            )}

            <Tile className="lg:col-span-4" title="Severity and events">
                {data.total_alerts ? (
                    <SeverityBar counts={data.alerts_by_severity} total={data.total_alerts} />
                ) : (
                    <p className="text-muted">No alerts on these logs. Every rule ran and nothing matched.</p>
                )}
                <EventTypes types={data.event_types} total={data.total_logs} />
            </Tile>

            <Tile className="lg:col-span-5" title="Attacking sources" action={<Link to="/alerts" className="text-sm text-phosphor hover:underline">All alerts</Link>}>
                {attackers ? (
                    <Sources sources={data.sources} focusIp={focusIp} setFocusIp={setFocusIp} />
                ) : (
                    <p className="text-muted">No source IP triggered a rule.</p>
                )}
            </Tile>

            <Tile className="lg:col-span-3" title="Detectors" action={<Link to="/detections" className="text-sm text-phosphor hover:underline">Rules</Link>}>
                <Detectors detectors={data.detectors} />
                <p className="mt-4 text-xs text-faint">Alerts per rule on the loaded logs. Play runs one rule on its own.</p>
            </Tile>

            {data.top_alerts.length > 0 && (
                <Tile className="lg:col-span-12" title="Highest-risk alerts" bodyClassName="pt-3">
                    <div className="scrollbar-thin -mx-1 grid auto-cols-[minmax(200px,1fr)] grid-flow-col gap-3 overflow-x-auto px-1 pb-1">
                        {data.top_alerts.map((a) => (
                            <Link
                                key={a.id}
                                to={`/alerts?id=${a.id}`}
                                onPointerEnter={() => setFocusIp(a.source_ip)}
                                onPointerLeave={() => setFocusIp(null)}
                                className="group flex flex-col rounded-[14px] border border-graticule bg-scope p-4 transition-colors hover:border-graticule-hi"
                            >
                                <div className="flex items-center justify-between">
                                    <SeverityBadge level={a.severity} />
                                    <span className="font-mono text-xs text-faint">{a.id}</span>
                                </div>
                                <div className="mt-2 font-display text-lg font-semibold leading-snug text-readout">{a.title}</div>
                                <div className="mt-1 font-mono text-sm text-muted">{a.source_ip}</div>
                                <div className="mt-auto flex items-end justify-between pt-4 text-sm text-faint">
                                    <span>{timeOf(a.last_seen)}</span>
                                    <span className="font-display text-2xl font-semibold text-readout group-hover:text-phosphor">{a.risk_score}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </Tile>
            )}
        </div>
    );
}
