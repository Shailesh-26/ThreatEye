import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";

import Button from "../components/ui/Button";
import Kbd from "../components/ui/Kbd";
import SeverityBadge, { SeverityMark } from "../components/ui/SeverityBadge";
import Skeleton from "../components/ui/Skeleton";
import Tile from "../components/ui/Tile";
import useData from "../hooks/useData";
import { dateOf, gap, humanize, mitreUrl, plural, timeOf, toDate } from "../lib/format";
import { severityOf } from "../lib/severity";
import { fetchAlerts } from "../services/alertService";

const LEVELS = ["Critical", "High", "Medium", "Low"];
const TABS = ["Summary", "Evidence", "Timeline", "IOCs"];
const IOC_LABELS = { ips: "IP addresses", domains: "Domains", urls: "URLs", emails: "Email addresses", hashes: "File hashes" };

async function copy(text, what) {
    try {
        await navigator.clipboard.writeText(text);
        toast.success(`Copied ${what}`);
    } catch {
        toast.error("Copy didn't work", { description: "The browser blocked clipboard access." });
    }
}

// ---- Gauges -------------------------------------------------------------------
function Gauge({ label, value, color, hint }) {
    const r = 42;
    const length = Math.PI * r; // half circle
    return (
        <div className="flex flex-col items-center" title={hint}>
            <svg viewBox="0 0 100 58" className="w-full max-w-[150px]">
                <path d="M8,52 A42,42 0 0 1 92,52" fill="none" stroke="#1f2e29" strokeWidth="8" strokeLinecap="round" />
                <motion.path
                    d="M8,52 A42,42 0 0 1 92,52"
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={length}
                    initial={{ strokeDashoffset: length }}
                    animate={{ strokeDashoffset: length * (1 - value / 100) }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </svg>
            <div className="-mt-10 font-display text-3xl font-semibold tabular-nums text-readout">{value}</div>
            <div className="mt-2 text-sm text-muted">{label}</div>
        </div>
    );
}

// ---- Tabs ---------------------------------------------------------------------
function Summary({ alert }) {
    const sevColor = severityOf(alert.severity).color;
    const url = mitreUrl(alert.mitre);
    return (
        <div className="space-y-6">
            {alert.compromise_suspected && (
                <div className="rounded-[14px] border border-sev-critical/40 bg-sev-critical/10 px-4 py-3 text-sm text-readout">
                    A login from this IP <strong className="font-semibold">succeeded</strong> after the failed attempts. Treat the account as possibly compromised.
                </div>
            )}

            <div className="grid grid-cols-3 gap-2">
                <Gauge label="Threat" value={alert.threat_score} color={sevColor} hint="How dangerous the activity looks" />
                <Gauge label="Confidence" value={alert.confidence} color="#6ee7a0" hint="How sure the rule is that this is an attack" />
                <Gauge label="Risk" value={alert.risk_score} color={sevColor} hint="70% threat + 30% confidence; used for sorting" />
            </div>

            <section>
                <h3 className="text-sm font-medium text-muted">Why it fired</h3>
                <ul className="mt-2 space-y-1.5">
                    {alert.score_reasons?.map((reason) => (
                        <li key={reason} className="flex gap-3 text-readout">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: sevColor }} />
                            {reason}
                        </li>
                    ))}
                </ul>
            </section>

            {(alert.targeted_accounts?.length > 0 || alert.ports_probed?.length > 0) && (
                <section>
                    <h3 className="text-sm font-medium text-muted">{alert.targeted_accounts ? "Accounts targeted" : "Ports probed"}</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {(alert.targeted_accounts ?? alert.ports_probed).map((v) => (
                            <span key={v} className="rounded-[8px] bg-scope px-2.5 py-1 font-mono text-[13px] text-readout">{v}</span>
                        ))}
                    </div>
                </section>
            )}

            <section className="rounded-[14px] border border-graticule bg-scope/60 p-4">
                <h3 className="text-sm font-medium text-muted">What to do</h3>
                <p className="mt-1.5 text-readout">{alert.recommendation}</p>
            </section>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
                <div>
                    <dt className="text-faint">MITRE ATT&CK</dt>
                    <dd className="mt-0.5">
                        {url ? (
                            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-phosphor hover:underline">
                                <span className="font-mono">{alert.mitre}</span> <ExternalLink size={12} />
                            </a>
                        ) : alert.mitre}
                        <div className="text-muted">{alert.mitre_name}</div>
                    </dd>
                </div>
                <div>
                    <dt className="text-faint">First seen</dt>
                    <dd className="mt-0.5 font-mono text-readout">{timeOf(alert.first_seen)}</dd>
                    <dd className="text-muted">{dateOf(alert.first_seen)}</dd>
                </div>
                <div>
                    <dt className="text-faint">Last seen</dt>
                    <dd className="mt-0.5 font-mono text-readout">{timeOf(alert.last_seen)}</dd>
                    <dd className="text-muted">{plural(alert.count, "event")}</dd>
                </div>
            </dl>
        </div>
    );
}

function Evidence({ alert }) {
    if (!alert.evidence?.length) return <p className="text-muted">This rule didn't record evidence rows.</p>;
    return (
        <ol className="space-y-3">
            {alert.evidence.map((item, i) => (
                <li key={i} className="rounded-[14px] border border-graticule bg-scope/60 p-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="font-mono text-readout">{timeOf(item.timestamp)}</span>
                        <span className="rounded-full bg-plate px-2 py-0.5 text-xs text-muted">field: {item.field}</span>
                        {item.asset && <span className="font-mono text-xs text-faint">{item.asset}</span>}
                    </div>
                    <div className="mt-2 break-all font-mono text-[13px] leading-relaxed text-readout">{item.excerpt}</div>
                    {item.patterns?.length > 0 && alert.matched_patterns?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.patterns.map((p) => (
                                <span key={p} className="rounded-full px-2 py-0.5 text-xs" style={{ color: severityOf(alert.severity).color, background: `${severityOf(alert.severity).color}1a` }}>
                                    {p}
                                </span>
                            ))}
                        </div>
                    )}
                </li>
            ))}
        </ol>
    );
}

function Timeline({ alert }) {
    const items = alert.timeline ?? [];
    if (!items.length) return <p className="text-muted">No timeline for this alert.</p>;
    const times = items.map((t) => toDate(t.timestamp)?.getTime() ?? 0);
    const start = Math.min(...times);
    const span = Math.max(1, Math.max(...times) - start);
    const color = severityOf(alert.severity).color;

    return (
        <div>
            {/* strip: where in the alert's time span each event happened */}
            <div className="relative mb-6 h-8 rounded-full bg-scope">
                {times.map((t, i) => (
                    <span key={i} className="absolute top-1.5 h-5 w-[3px] -translate-x-1/2 rounded-full" style={{ left: `calc(12px + (100% - 24px) * ${(t - start) / span})`, background: color }} />
                ))}
                <span className="absolute -bottom-5 left-3 font-mono text-[11px] text-faint">{timeOf(items[0].timestamp)}</span>
                <span className="absolute -bottom-5 right-3 font-mono text-[11px] text-faint">{timeOf(items[items.length - 1].timestamp)}</span>
            </div>

            <ol className="relative ml-2 border-l border-graticule-hi pl-6">
                {items.map((item, i) => {
                    const delta = i ? (times[i] - times[i - 1]) / 1000 : null;
                    return (
                        <li key={i} className="relative pb-4 last:pb-0">
                            <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rotate-45" style={{ background: color }} />
                            <div className="flex flex-wrap items-baseline gap-x-3">
                                <span className="font-mono text-readout">{timeOf(item.timestamp)}</span>
                                {delta !== null && <span className="text-xs text-faint">{gap(delta)}</span>}
                            </div>
                            <div className="text-sm text-muted">
                                {humanize(item.event)}
                                {item.asset && <span className="font-mono text-faint"> on {item.asset}</span>}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

function Iocs({ alert }) {
    const groups = Object.entries(IOC_LABELS)
        .map(([key, label]) => [label, alert.iocs?.[key] ?? []])
        .filter(([, values]) => values.length);
    if (!groups.length) return <p className="text-muted">No indicators were found in this alert's rows.</p>;
    const all = groups.flatMap(([, values]) => values).join("\n");
    return (
        <div className="space-y-5">
            {groups.map(([label, values]) => (
                <section key={label}>
                    <h3 className="text-sm font-medium text-muted">{label}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {values.map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => copy(value, value)}
                                title="Copy"
                                className="group inline-flex max-w-full items-center gap-2 rounded-[10px] border border-graticule-hi bg-scope px-3 py-1.5 font-mono text-[13px] text-readout transition-colors hover:border-phosphor/60"
                            >
                                <span className="truncate">{value}</span>
                                <Copy size={13} className="shrink-0 text-faint group-hover:text-phosphor" />
                            </button>
                        ))}
                    </div>
                </section>
            ))}
            <Button size="sm" onClick={() => copy(all, "all indicators")}><Copy size={14} /> Copy all</Button>
            <p className="text-xs text-faint">Indicators are pulled from the rows behind this alert. Reputation lookups are on the roadmap.</p>
        </div>
    );
}

// ---- Investigation panel ---------------------------------------------------------
function Investigation({ alert }) {
    const [tab, setTab] = useState("Summary");
    const counts = {
        Evidence: alert.evidence?.length ?? 0,
        Timeline: alert.timeline?.length ?? 0,
        IOCs: Object.entries(IOC_LABELS).reduce((n, [k]) => n + (alert.iocs?.[k]?.length ?? 0), 0),
    };

    return (
        <motion.article
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            id="investigation"
            className="glass flex min-h-[640px] min-w-0 scroll-mt-24 flex-col rounded-[var(--radius-sheet)]"
        >
            <header className="border-b border-graticule px-6 pb-4 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <SeverityBadge level={alert.severity} />
                    <span className="text-xs text-faint"><span className="font-mono">{alert.id}</span>, computed from the loaded logs</span>
                </div>
                <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-readout">{alert.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => copy(alert.source_ip, alert.source_ip)} className="inline-flex items-center gap-2 font-mono text-muted hover:text-readout" title="Copy IP">
                        {alert.source_ip} <Copy size={13} />
                    </button>
                    <Link to={`/logs?q=${alert.source_ip}`} className="text-sm text-phosphor hover:underline">See all rows from this IP</Link>
                </div>

                <div role="tablist" aria-label="Investigation" className="scrollbar-thin -mx-2 mt-5 flex gap-1 overflow-x-auto px-2">
                    {TABS.map((name) => (
                        <button
                            key={name}
                            role="tab"
                            type="button"
                            aria-selected={tab === name}
                            onClick={() => setTab(name)}
                            className={`relative shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${tab === name ? "text-readout" : "text-muted hover:text-readout"}`}
                        >
                            {tab === name && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-plate-hi" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                            <span className="relative">
                                {name}
                                {counts[name] !== undefined && <span className="ml-1.5 tabular-nums text-faint">{counts[name]}</span>}
                            </span>
                        </button>
                    ))}
                </div>
            </header>

            <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5" role="tabpanel">
                <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
                        {tab === "Summary" && <Summary alert={alert} />}
                        {tab === "Evidence" && <Evidence alert={alert} />}
                        {tab === "Timeline" && <Timeline alert={alert} />}
                        {tab === "IOCs" && <Iocs alert={alert} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.article>
    );
}

// ---- Page ----------------------------------------------------------------------------
export default function Alerts() {
    const { data: alerts, loading, error, reload } = useData(fetchAlerts);
    const [params, setParams] = useSearchParams();
    const listRef = useRef(null);

    const q = params.get("q") ?? params.get("ip") ?? "";
    const severity = params.get("severity");
    const selectedId = params.get("id");

    const update = useCallback((changes) => {
        setParams((prev) => {
            const next = new URLSearchParams(prev);
            for (const [k, v] of Object.entries(changes)) {
                if (v === null || v === "") next.delete(k);
                else next.set(k, v);
            }
            return next;
        }, { replace: true });
    }, [setParams]);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return (alerts ?? []).filter((a) => {
            if (severity && a.severity !== severity) return false;
            if (needle && !`${a.title} ${a.source_ip} ${a.detector_id} ${a.id}`.toLowerCase().includes(needle)) return false;
            return true;
        });
    }, [alerts, q, severity]);

    const selected = filtered.find((a) => a.id === selectedId) ?? filtered[0] ?? null;
    const index = selected ? filtered.indexOf(selected) : -1;

    // j / k (or arrow keys) move through the list.
    useEffect(() => {
        const onKey = (e) => {
            if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
            if (!filtered.length) return;
            if (e.key === "j" || e.key === "ArrowDown") {
                e.preventDefault();
                update({ id: filtered[Math.min(filtered.length - 1, index + 1)].id });
            } else if (e.key === "k" || e.key === "ArrowUp") {
                e.preventDefault();
                update({ id: filtered[Math.max(0, index - 1)].id });
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [filtered, index, update]);

    useEffect(() => {
        listRef.current?.querySelector(`[data-id="${selected?.id}"]`)?.scrollIntoView({ block: "nearest" });
    }, [selected?.id]);

    const counts = useMemo(() => {
        const c = {};
        for (const a of alerts ?? []) c[a.severity] = (c[a.severity] ?? 0) + 1;
        return c;
    }, [alerts]);

    if (loading && !alerts) {
        return (
            <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
                <Skeleton className="h-[640px]" />
                <Skeleton className="h-[640px]" />
            </div>
        );
    }

    if (error && !alerts) {
        return (
            <Tile title="Alerts couldn't load">
                <p className="text-muted">{error?.response?.data?.detail ?? "The server didn't respond."}</p>
                <Button className="mt-4" onClick={reload}>Try again</Button>
            </Tile>
        );
    }

    if (!alerts.length) {
        return (
            <Tile title="No alerts">
                <p className="max-w-[60ch] text-muted">
                    Every detector ran on the loaded logs and nothing matched. Load a sample with attacks in it, such as the mixed SOC day, to see the investigation view.
                </p>
                <Button to="/logs" variant="primary" className="mt-5">Go to Logs</Button>
            </Tile>
        );
    }

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
            <div className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-24">
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                    <input
                        value={q}
                        onChange={(e) => update({ q: e.target.value, ip: null, id: null })}
                        placeholder="Filter by IP, rule or title"
                        aria-label="Filter alerts"
                        className="h-10 w-full rounded-full border border-graticule-hi bg-bezel pl-9 pr-4 text-sm text-readout outline-none placeholder:text-faint focus:border-phosphor focus-visible:outline-none"
                    />
                </div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Severity">
                    {LEVELS.filter((l) => counts[l]).map((level) => (
                        <button
                            key={level}
                            type="button"
                            onClick={() => update({ severity: severity === level ? null : level, id: null })}
                            aria-pressed={severity === level}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors ${severity === level ? "border-graticule-hi bg-plate text-readout" : "border-graticule text-muted hover:text-readout"}`}
                        >
                            <SeverityMark level={level} /> {level} <span className="tabular-nums text-faint">{counts[level]}</span>
                        </button>
                    ))}
                </div>

                <ul ref={listRef} className="scrollbar-thin flex max-h-[560px] flex-col gap-1.5 overflow-y-auto rounded-[var(--radius-panel)] border border-graticule bg-bezel p-2" aria-label="Alerts">
                    {filtered.length === 0 && <li className="p-4 text-sm text-muted">No alerts match. Clear the filters to see all {alerts.length}.</li>}
                    {filtered.map((a) => {
                        const active = a === selected;
                        return (
                            <li key={a.id} data-id={a.id}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        update({ id: a.id });
                                        // On phones the panel is below the list: bring it into view.
                                        if (window.innerWidth < 1024) {
                                            requestAnimationFrame(() => document.getElementById("investigation")?.scrollIntoView({ behavior: "smooth" }));
                                        }
                                    }}
                                    aria-current={active ? "true" : undefined}
                                    className={`relative grid w-full grid-cols-[auto_1fr_auto] items-start gap-x-3 rounded-[12px] px-3 py-3 text-left transition-colors ${active ? "bg-plate-hi" : "hover:bg-plate"}`}
                                >
                                    {active && <motion.span layoutId="alert-active" className="absolute inset-y-2 left-0 w-[3px] rounded-full" style={{ background: severityOf(a.severity).color }} />}
                                    <span className="mt-1.5"><SeverityMark level={a.severity} size={9} /></span>
                                    <span className="min-w-0">
                                        <span className="block truncate text-readout">{a.title}</span>
                                        <span className="block font-mono text-sm text-muted">{a.source_ip}</span>
                                        <span className="block text-xs text-faint">{timeOf(a.last_seen)}, {humanize(a.detector_id)}</span>
                                    </span>
                                    <span className="font-display text-xl font-semibold tabular-nums text-readout">{a.risk_score}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
                <p className="hidden items-center gap-1.5 text-xs text-faint lg:flex">
                    <Kbd>J</Kbd><Kbd>K</Kbd> move through alerts. Sorted by risk.
                </p>
            </div>

            {selected ? <Investigation key={selected.id} alert={selected} /> : null}
        </div>
    );
}
