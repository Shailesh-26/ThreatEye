import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FileUp, Search, X } from "lucide-react";
import { toast } from "sonner";

import Button from "../components/ui/Button";
import Kbd from "../components/ui/Kbd";
import SeverityBadge, { SeverityMark } from "../components/ui/SeverityBadge";
import Skeleton from "../components/ui/Skeleton";
import Tile from "../components/ui/Tile";
import useData from "../hooks/useData";
import { hourMinute, humanize, plural, toDate } from "../lib/format";
import { SEVERITY, severityOf } from "../lib/severity";
import { fetchAlerts } from "../services/alertService";
import { fetchLogs, listSamples, loadSample, uploadLogs } from "../services/logService";

const PREFERRED_COLUMNS = [
    "timestamp", "source_ip", "event_type", "username", "destination_ip", "destination_port",
    "url", "payload", "status", "message", "user_agent",
];

const SAMPLE_NOTES = {
    "01_brute_force.csv": "Two brute-force attackers; one gets in",
    "02_port_scan.csv": "A fast port scan and IDS-labelled scan events",
    "03_sql_injection.csv": "SQL injection next to harmless look-alikes",
    "04_xss.csv": "XSS payloads next to a normal image tag",
    "05_mixed_soc_day.csv": "A full day, four attackers, five alerts",
    "06_clean_baseline.csv": "Normal traffic only, no alerts expected",
    "07_json_format.json": "JSON file with upper-case event names",
    "08_mixed_soc_day.xlsx": "The mixed day as an Excel file",
    "99_invalid_missing_column.csv": "Broken on purpose: shows the error message",
};

const loadLogsAndAlerts = () => Promise.all([fetchLogs(), fetchAlerts()]).then(([logs, alerts]) => ({ logs, alerts }));

// ---- Drop zone -------------------------------------------------------------------
function DropZone({ onDone }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [progress, setProgress] = useState(null);
    const [result, setResult] = useState(null);

    async function upload(file) {
        if (!file) return;
        setResult(null);
        setProgress(0);
        try {
            const data = await uploadLogs(file, setProgress);
            setResult({ ok: true, name: file.name, ...data });
            onDone();
        } catch (error) {
            setResult({ ok: false, name: file.name, message: error?.response?.data?.detail ?? "The server didn't respond." });
        } finally {
            setProgress(null);
        }
    }

    return (
        <div>
            <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    upload(e.dataTransfer.files?.[0]);
                }}
                aria-label="Upload a log file: click or drop a file here"
                className={`inset-plate relative flex min-h-[190px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[var(--radius-panel)] px-6 py-8 text-center transition-[outline-color] outline outline-2 -outline-offset-2 ${dragging ? "outline-phosphor" : "outline-transparent hover:outline-graticule-hi"}`}
            >
                <motion.div animate={{ y: dragging ? -6 : 0, scale: dragging ? 1.08 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
                    <FileUp size={30} className={dragging ? "text-phosphor" : "text-muted"} />
                </motion.div>
                <p className="mt-3 font-display text-xl font-semibold text-readout">
                    {dragging ? "Drop to upload" : "Drop a log file here, or click to choose one"}
                </p>
                <p className="mt-1 text-sm text-faint">
                    CSV, Excel, JSON or text. Needs timestamp, source_ip and event_type columns. Replaces the logs loaded now.
                </p>

                {progress !== null && (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-scope">
                        <motion.div className="h-full bg-phosphor" animate={{ width: `${Math.round(progress * 100)}%` }} />
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,.xlsx,.json,.txt"
                    className="hidden"
                    onChange={(e) => {
                        upload(e.target.files?.[0]);
                        e.target.value = "";
                    }}
                />
            </div>

            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[14px] border px-4 py-3 text-sm ${result.ok ? "border-graticule-hi bg-plate" : "border-sev-critical/40 bg-sev-critical/10"}`}
                    >
                        <span className="font-mono text-readout">{result.name}</span>
                        {result.ok ? (
                            <>
                                <span className="text-muted">
                                    {plural(result.count, "row")} loaded{result.skipped_rows ? `, ${result.skipped_rows} skipped (missing timestamp, IP or event)` : ""}
                                </span>
                                <Link to="/alerts" className="ml-auto font-medium text-phosphor hover:underline">
                                    {plural(result.alerts, "alert")}
                                </Link>
                            </>
                        ) : (
                            <span className="text-sev-critical">{result.message}</span>
                        )}
                        <button type="button" onClick={() => setResult(null)} aria-label="Dismiss" className="text-faint hover:text-readout">
                            <X size={15} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ---- Sample datasets --------------------------------------------------------------
function Samples({ onDone }) {
    const [samples, setSamples] = useState([]);
    const [busy, setBusy] = useState(null);

    useEffect(() => {
        listSamples().then(setSamples).catch(() => setSamples([]));
    }, []);

    async function load(name) {
        setBusy(name);
        try {
            const result = await loadSample(name);
            toast.success(`${name} loaded`, { description: `${plural(result.count, "row")}, ${plural(result.alerts, "alert")}.` });
            onDone();
        } catch (error) {
            toast.error(`${name} was rejected`, { description: error?.response?.data?.detail ?? "The server didn't respond." });
        } finally {
            setBusy(null);
        }
    }

    if (!samples.length) {
        return <p className="text-sm text-faint">No sample files found in the datasets folder.</p>;
    }

    return (
        <ul className="scrollbar-thin -mx-2 max-h-[236px] space-y-0.5 overflow-y-auto">
            {samples.map((s) => (
                <li key={s.name}>
                    <button
                        type="button"
                        onClick={() => load(s.name)}
                        disabled={busy !== null}
                        className="w-full rounded-[10px] px-2 py-1.5 text-left transition-colors hover:bg-plate disabled:opacity-60"
                    >
                        <span className="block font-mono text-[13px] text-readout">{busy === s.name ? "Loading..." : s.name}</span>
                        <span className="block text-xs text-faint">{SAMPLE_NOTES[s.name] ?? `${Math.round(s.size / 1024)} KB`}</span>
                    </button>
                </li>
            ))}
        </ul>
    );
}

// ---- Row detail sheet ----------------------------------------------------------------
function RowSheet({ row, alerts, onClose }) {
    useEffect(() => {
        if (!row) return undefined;
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [row, onClose]);

    return (
        <AnimatePresence>
            {row && (
                <>
                    <motion.div className="fixed inset-0 z-40 bg-scope/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
                    <motion.aside
                        role="dialog"
                        aria-label="Log row"
                        className="glass fixed inset-y-3 right-3 z-50 flex w-[min(440px,calc(100vw-24px))] flex-col rounded-[var(--radius-sheet)]"
                        initial={{ x: 40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 40, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 30 }}
                    >
                        <div className="flex items-center justify-between border-b border-graticule px-5 py-4">
                            <h2 className="font-display text-xl font-semibold text-readout">Log row</h2>
                            <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted hover:bg-plate hover:text-readout">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">
                            {alerts.length > 0 && (
                                <div className="mb-5 space-y-2">
                                    {alerts.map((a) => (
                                        <Link key={a.id} to={`/alerts?id=${a.id}`} className="flex items-center gap-3 rounded-[12px] border border-graticule-hi bg-plate px-3 py-2.5 hover:border-faint">
                                            <SeverityMark level={a.severity} />
                                            <span className="flex-1 text-readout">{a.title}</span>
                                            <span className="font-mono text-xs text-faint">{a.id}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            <dl className="space-y-3">
                                {Object.entries(row).map(([key, value]) => (
                                    <div key={key}>
                                        <dt className="text-xs text-faint">{humanize(key)}</dt>
                                        <dd className="mt-0.5 break-all font-mono text-[13px] text-readout">
                                            {value === null || value === undefined ? <span className="text-faint">empty</span> : String(value)}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

// ---- Page ---------------------------------------------------------------------------------
export default function Logs() {
    const { data, loading, error, reload } = useData(loadLogsAndAlerts);
    const [params, setParams] = useSearchParams();
    const [visible, setVisible] = useState(300);
    const [openRow, setOpenRow] = useState(null);
    const searchRef = useRef(null);

    const q = params.get("q") ?? "";
    const eventFilter = params.get("event");
    const onlyAlerts = params.get("alerts") === "1";
    const from = params.get("from");
    const to = params.get("to");

    const setParam = useCallback((key, value) => {
        setParams((prev) => {
            const next = new URLSearchParams(prev);
            if (value === null || value === "" || value === undefined) next.delete(key);
            else next.set(key, value);
            return next;
        }, { replace: true });
        setVisible(300);
    }, [setParams]);

    // "/" jumps to the search box, like most log tools.
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const logs = useMemo(() => data?.logs ?? [], [data]);
    const alerts = useMemo(() => data?.alerts ?? [], [data]);

    // Which alerts each row belongs to (matched on timestamp + source IP).
    const rowAlerts = useMemo(() => {
        const map = new Map();
        for (const alert of alerts) {
            for (const item of alert.timeline ?? []) {
                const key = `${item.timestamp}|${item.source_ip}`;
                map.set(key, [...(map.get(key) ?? []), alert]);
            }
        }
        return map;
    }, [alerts]);
    const alertsFor = useCallback((row) => rowAlerts.get(`${row.timestamp}|${row.source_ip}`) ?? [], [rowAlerts]);

    const columns = useMemo(() => {
        const keys = new Set();
        for (const row of logs.slice(0, 300)) Object.keys(row).forEach((k) => keys.add(k));
        return [...PREFERRED_COLUMNS.filter((c) => keys.has(c)), ...[...keys].filter((k) => !PREFERRED_COLUMNS.includes(k))];
    }, [logs]);

    const eventCounts = useMemo(() => {
        const counts = new Map();
        for (const row of logs) counts.set(row.event_type, (counts.get(row.event_type) ?? 0) + 1);
        return [...counts.entries()].sort((a, b) => b[1] - a[1]);
    }, [logs]);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        const fromDate = toDate(from);
        const toDateValue = toDate(to);
        return logs.filter((row) => {
            if (eventFilter && row.event_type !== eventFilter) return false;
            if (onlyAlerts && !alertsFor(row).length) return false;
            if (fromDate || toDateValue) {
                const t = toDate(row.timestamp);
                if (!t || (fromDate && t < fromDate) || (toDateValue && t >= toDateValue)) return false;
            }
            if (needle) {
                return Object.values(row).some((v) => v !== null && String(v).toLowerCase().includes(needle));
            }
            return true;
        });
    }, [logs, q, eventFilter, onlyAlerts, from, to, alertsFor]);

    const closeSheet = useCallback(() => setOpenRow(null), []);

    return (
        <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-12">
                <Tile className="lg:col-span-8" title="Upload">
                    <DropZone onDone={reload} />
                </Tile>
                <Tile className="lg:col-span-4" title="Sample datasets" action={<span className="text-xs text-faint">One click to load</span>}>
                    <Samples onDone={reload} />
                </Tile>
            </div>

            <Tile flush>
                <div className="flex flex-wrap items-center gap-3 border-b border-graticule px-5 py-4">
                    <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                        <input
                            ref={searchRef}
                            value={q}
                            onChange={(e) => setParam("q", e.target.value)}
                            placeholder="Search any field"
                            aria-label="Search log rows"
                            className="h-9 w-full rounded-full border border-graticule-hi bg-scope pl-9 pr-10 text-sm text-readout outline-none placeholder:text-faint focus:border-phosphor focus-visible:outline-none"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2"><Kbd>/</Kbd></span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setParam("alerts", onlyAlerts ? null : "1")}
                        aria-pressed={onlyAlerts}
                        className={`flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition-colors ${onlyAlerts ? "border-phosphor/60 bg-phosphor/10 text-phosphor" : "border-graticule-hi text-muted hover:text-readout"}`}
                    >
                        <span className={`h-3.5 w-6 rounded-full p-0.5 transition-colors ${onlyAlerts ? "bg-phosphor" : "bg-graticule-hi"}`}>
                            <span className={`block h-2.5 w-2.5 rounded-full bg-scope transition-transform ${onlyAlerts ? "translate-x-2.5" : ""}`} />
                        </span>
                        Only rows in alerts
                    </button>

                    {(from || to) && (
                        <button type="button" onClick={() => { setParam("from", null); setParam("to", null); }} className="flex h-9 items-center gap-2 rounded-full border border-graticule-hi bg-plate px-3 font-mono text-sm text-readout">
                            {hourMinute(from)} to {hourMinute(to)} <X size={14} />
                        </button>
                    )}

                    <span className="ml-auto text-sm text-faint">
                        {filtered.length === logs.length ? plural(logs.length, "row") : `${filtered.length.toLocaleString()} of ${plural(logs.length, "row")}`}
                    </span>
                </div>

                {eventCounts.length > 1 && (
                    <div className="scrollbar-thin flex gap-2 overflow-x-auto border-b border-graticule px-5 py-3">
                        {eventCounts.map(([type, count]) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setParam("event", eventFilter === type ? null : type)}
                                aria-pressed={eventFilter === type}
                                className={`shrink-0 rounded-full px-3 py-1 text-sm transition-colors ${eventFilter === type ? "bg-plate-hi text-readout" : "text-muted hover:bg-plate"}`}
                            >
                                {humanize(type)} <span className="tabular-nums text-faint">{count}</span>
                            </button>
                        ))}
                    </div>
                )}

                {loading && !data ? (
                    <div className="space-y-2 p-5">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-8" />)}</div>
                ) : error && !data ? (
                    <p className="p-5 text-muted">The logs couldn't load. {error?.response?.data?.detail ?? "Check that the backend is running."}</p>
                ) : !logs.length ? (
                    <p className="p-8 text-center text-muted">No logs loaded. Drop a file above or pick a sample dataset.</p>
                ) : !filtered.length ? (
                    <p className="p-8 text-center text-muted">No rows match these filters.</p>
                ) : (
                    <div className="scrollbar-thin max-h-[640px] overflow-auto">
                        <table className="w-full border-separate border-spacing-0 text-sm">
                            <thead>
                                <tr>
                                    {columns.map((col) => (
                                        <th key={col} scope="col" className="sticky top-0 z-10 whitespace-nowrap border-b border-graticule bg-bezel px-4 py-2.5 text-left font-medium text-muted first:pl-6">
                                            {humanize(col)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.slice(0, visible).map((row, i) => {
                                    const linked = alertsFor(row);
                                    const worst = linked.reduce((w, a) => (!w || SEVERITY[a.severity].rank > SEVERITY[w].rank ? a.severity : w), null);
                                    return (
                                        <tr
                                            key={`${row.timestamp}-${row.source_ip}-${i}`}
                                            onClick={() => setOpenRow(row)}
                                            onKeyDown={(e) => e.key === "Enter" && setOpenRow(row)}
                                            tabIndex={0}
                                            className="cursor-pointer outline-none transition-colors hover:bg-plate/70 focus-visible:bg-plate"
                                        >
                                            {columns.map((col, c) => (
                                                <td
                                                    key={col}
                                                    title={row[col] != null ? String(row[col]) : undefined}
                                                    className={`max-w-[280px] truncate border-b border-graticule/60 px-4 py-2 ${c === 0 ? "relative pl-6" : ""} ${["timestamp", "source_ip", "destination_ip", "destination_port", "url", "payload", "user_agent"].includes(col) ? "font-mono text-[13px]" : ""} ${row[col] == null ? "text-faint" : "text-readout"}`}
                                                >
                                                    {c === 0 && worst && (
                                                        <span className="absolute inset-y-1 left-2 w-[3px] rounded-full" style={{ background: severityOf(worst).color }} />
                                                    )}
                                                    {row[col] == null ? "" : col === "event_type" ? humanize(row[col]) : String(row[col])}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filtered.length > visible && (
                            <div className="p-4 text-center">
                                <Button onClick={() => setVisible((v) => v + 300)}>Show 300 more</Button>
                            </div>
                        )}
                    </div>
                )}
            </Tile>

            {alerts.length > 0 && (
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-faint">
                    A coloured edge marks rows that are part of an alert:
                    {["Critical", "High", "Medium"].map((l) => <SeverityBadge key={l} level={l} />)}
                    Click a row for every field and its alerts.
                </p>
            )}

            <RowSheet row={openRow} alerts={openRow ? alertsFor(openRow) : []} onClose={closeSheet} />
        </div>
    );
}
