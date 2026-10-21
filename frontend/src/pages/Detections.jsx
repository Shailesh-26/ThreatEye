import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Play } from "lucide-react";

import Button from "../components/ui/Button";
import SeverityBadge from "../components/ui/SeverityBadge";
import Skeleton from "../components/ui/Skeleton";
import Tile from "../components/ui/Tile";
import useData from "../hooks/useData";
import { mitreUrl, plural, timeOf } from "../lib/format";
import { getDetectionRules, runDetectionRule } from "../services/detectionService";

// What each rule looks at, in plain words (mirrors the backend detectors).
const HOW = {
    brute_force: { kind: "Counting rule", reads: "event_type, source_ip, timestamp, username", threshold: "5 failed logins in 5 minutes" },
    port_scan: { kind: "Counting rule", reads: "event_type, source_ip, destination_port, timestamp", threshold: "10 different ports in 60 seconds, or 3 IDS port_scan events" },
    sql_injection: { kind: "Pattern rule", reads: "url, payload, query, request, command, message", threshold: "Any of 8 SQL injection techniques" },
    xss: { kind: "Pattern rule", reads: "url, payload, query, request, message", threshold: "Any of 6 script-injection techniques" },
};

function RuleCard({ rule }) {
    const [state, setState] = useState({ status: "idle" });
    const how = HOW[rule.id];
    const url = mitreUrl(rule.mitre);

    async function run() {
        setState({ status: "running" });
        try {
            const result = await runDetectionRule(rule.id);
            setState({ status: "done", result, at: new Date() });
        } catch (error) {
            setState({ status: "error", message: error?.response?.data?.detail ?? "The server didn't respond." });
        }
    }

    return (
        <article className="flex flex-col rounded-[var(--radius-panel)] border border-graticule bg-bezel p-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0">
                    <h2 className="font-display text-2xl font-semibold text-readout">{rule.name}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-faint">
                        {how?.kind} <span>version {rule.version}</span>
                        {url && (
                            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-phosphor hover:underline">
                                <span className="font-mono">{rule.mitre}</span> {rule.mitre_name} <ExternalLink size={12} />
                            </a>
                        )}
                    </div>
                </div>
                <Button variant="primary" size="sm" onClick={run} disabled={state.status === "running"}>
                    <Play size={13} fill="currentColor" /> {state.status === "running" ? "Running" : "Run now"}
                </Button>
            </div>

            <p className="mt-4 max-w-[62ch] text-muted">{rule.description}</p>

            {how && (
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-[12px] bg-scope px-3.5 py-2.5">
                        <dt className="text-faint">Fires when</dt>
                        <dd className="mt-0.5 text-readout">{how.threshold}</dd>
                    </div>
                    <div className="rounded-[12px] bg-scope px-3.5 py-2.5">
                        <dt className="text-faint">Reads columns</dt>
                        <dd className="mt-0.5 font-mono text-[13px] text-readout">{how.reads}</dd>
                    </div>
                </dl>
            )}

            <AnimatePresence mode="wait">
                {state.status === "done" && (
                    <motion.div key="done" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="mt-5 border-t border-graticule pt-4">
                            <div className="flex items-baseline justify-between text-sm">
                                <span className="text-readout">
                                    {state.result.alerts ? plural(state.result.alerts, "alert") : "No alerts"} on the loaded logs
                                </span>
                                <span className="font-mono text-faint">ran at {state.at.toLocaleTimeString("en-GB", { hour12: false })}</span>
                            </div>
                            <ul className="mt-3 space-y-2">
                                {state.result.results.map((a, i) => (
                                    <motion.li
                                        key={`${a.source_ip}-${i}`}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[12px] bg-scope px-3.5 py-2.5 text-sm"
                                    >
                                        <SeverityBadge level={a.severity} />
                                        <span className="font-mono text-readout">{a.source_ip}</span>
                                        <span className="text-muted">{a.score_reasons?.[0]}</span>
                                        <span className="ml-auto font-mono text-faint">{timeOf(a.last_seen)}</span>
                                    </motion.li>
                                ))}
                            </ul>
                            {state.result.alerts > 0 && (
                                <Link to={`/alerts?q=${rule.id}`} className="mt-3 inline-block text-sm text-phosphor hover:underline">
                                    Investigate these in Alerts
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
                {state.status === "error" && (
                    <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-sev-critical">
                        {state.message}
                    </motion.p>
                )}
            </AnimatePresence>
        </article>
    );
}

export default function Detections() {
    const { data: rules, loading, error, reload } = useData(getDetectionRules);

    if (loading && !rules) {
        return <div className="grid gap-4 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}</div>;
    }
    if (error && !rules) {
        return (
            <Tile title="Rules couldn't load">
                <p className="text-muted">{error?.response?.data?.detail ?? "The server didn't respond."}</p>
                <Button className="mt-4" onClick={reload}>Try again</Button>
            </Tile>
        );
    }

    const enabled = rules.filter((r) => r.enabled);
    const planned = rules.filter((r) => !r.enabled);

    return (
        <div className="space-y-8">
            <p className="max-w-[70ch] text-muted">
                Every rule runs automatically whenever logs are uploaded or a page loads. Run now checks one rule on its own
                against the logs loaded at the moment, which is useful after changing a rule.
            </p>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-2">
                {enabled.map((rule) => <RuleCard key={rule.id} rule={rule} />)}
            </div>

            {planned.length > 0 && (
                <section>
                    <h2 className="font-display text-xl font-semibold text-readout">Planned rules</h2>
                    <p className="mt-1 text-sm text-faint">Not built yet. Each will be one new file in backend/app/detection/.</p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                        {planned.map((r) => (
                            <li key={r.id} className="rounded-full border border-dashed border-graticule-hi px-4 py-2 text-sm text-muted">
                                {r.name} <span className="font-mono text-faint">{r.mitre}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
