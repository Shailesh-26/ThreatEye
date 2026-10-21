import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";
import ReplayScope from "../components/replay/ReplayScope";
import day from "../data/sampleDay.json";
import { isAuthenticated } from "../services/authService";
import { severityOf } from "../lib/severity";

const GITHUB_URL = "https://github.com/Shailesh-26/ThreatEye";

// ---- Real examples pulled from the replay data -------------------------
const alertBy = (detector, ip) => day.alerts.find((a) => a.detector_id === detector && a.ip === ip);
const bruteForce = alertBy("brute_force", "203.0.113.10");
const portScan = alertBy("port_scan", "203.0.113.50");
const sqli = day.alerts.find((a) => a.detector_id === "sql_injection");
const xss = day.alerts.find((a) => a.detector_id === "xss");

const eventsOf = (alert) => day.events.filter((e) => e.alert === alert.index);
const bruteForceFailures = eventsOf(bruteForce).filter((e) => e.event === "login_failed");
const bruteForceSuccess = eventsOf(bruteForce).find((e) => e.event === "login_success");
const probedPorts = new Set(eventsOf(portScan).map((e) => String(e.detail?.value)));
const payloadOf = (alert) => eventsOf(alert).find((e) => e.detail?.field === "payload")?.detail.value ?? "";

const COMMON_PORTS = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 995, 1433, 3306, 3389, 5432, 5900, 8080];

/** Shows text with the part matched by `regex` highlighted. */
function Highlighted({ text, regex, color }) {
    const match = text.match(regex);
    if (!match) return <>{text}</>;
    const start = match.index;
    const end = start + match[0].length;
    return (
        <>
            {text.slice(0, start)}
            <mark className="rounded-[3px] px-0.5 text-scope" style={{ background: color }}>{text.slice(start, end)}</mark>
            {text.slice(end)}
        </>
    );
}

// ---- What happens to an uploaded file (a real sequence) ---------------
const STEPS = [
    {
        title: "Read",
        text: "CSV, Excel, JSON or comma-separated text. Column names are normalised, blank cells become empty values, and rows without a timestamp, source IP or event type are skipped.",
        example: () => (
            <div className="space-y-4">
                <div>
                    <div className="mb-2 text-sm text-faint">A row as uploaded</div>
                    <pre className="scrollbar-thin overflow-x-auto rounded-[12px] bg-scope p-4 font-mono text-[13px] leading-relaxed text-muted">
{`timestamp,source_ip,event_type,username,status
2026-10-15 16:30:00,203.0.113.10,LOGIN_FAILED,anita,failed`}
                    </pre>
                </div>
                <div>
                    <div className="mb-2 text-sm text-faint">The row ThreatEye stores</div>
                    <pre className="scrollbar-thin overflow-x-auto rounded-[12px] bg-scope p-4 font-mono text-[13px] leading-relaxed text-readout">
{`{ "timestamp": "2026-10-15 16:30:00",
  "source_ip": "203.0.113.10",
  "event_type": "login_failed",
  "username": "anita", "status": "failed" }`}
                    </pre>
                </div>
            </div>
        ),
    },
    {
        title: "Detect",
        text: "Four rules run over every row. Two count events inside a time window; two look for attack patterns in request data.",
        example: () => (
            <div>
                <div className="mb-3 text-sm text-faint">
                    Failed logins from <span className="font-mono text-muted">{bruteForce.ip}</span>
                </div>
                <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {bruteForceFailures.map((event) => (
                        <li key={event.time} className="rounded-[10px] bg-scope px-3 py-2 font-mono text-sm text-sev-critical">
                            {event.time}
                        </li>
                    ))}
                </ol>
                <p className="mt-4 text-readout">
                    {bruteForceFailures.length} failures between {bruteForceFailures[0].time} and{" "}
                    {bruteForceFailures[bruteForceFailures.length - 1].time}, inside the 5-minute window. The
                    rule needs 5, so it fires.
                </p>
                {bruteForceSuccess && (
                    <p className="mt-2 text-muted">
                        At {bruteForceSuccess.time} the same IP logs in as {bruteForceSuccess.detail?.value}. That
                        turns it into a possible compromise.
                    </p>
                )}
            </div>
        ),
    },
    {
        title: "Score",
        text: "Scores come from a formula you can check by hand. Every doubling of events adds the same number of points, so 5 attempts and 500 attempts don't look the same.",
        example: () => {
            const n = bruteForceFailures.length;
            const growth = 8 * Math.log2(n);
            return (
                <div>
                    <div className="space-y-2 font-mono text-[15px] text-muted">
                        <div>base for brute force <span className="float-right text-readout">50</span></div>
                        <div>8 × log2({n} failures) <span className="float-right text-readout">+{growth.toFixed(2)}</span></div>
                        <div>login succeeded afterwards <span className="float-right text-readout">+25</span></div>
                        <div className="border-t border-graticule pt-2 text-readout">
                            threat score, rounded
                            <span className="float-right font-display text-2xl font-semibold text-sev-critical">
                                {bruteForce.threat_score}
                            </span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted">
                        90 and above is Critical, 70 High, 45 Medium. The alert also stores the reasons in plain words:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-readout">
                        {bruteForce.reasons.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                </div>
            );
        },
    },
    {
        title: "Explain",
        text: "Each alert lists the rows that triggered it, which field matched, the technique, the targeted page, and any IPs, domains or URLs found.",
        example: () => (
            <div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-faint">Evidence for {sqli.title.toLowerCase()} from <span className="font-mono text-muted">{sqli.ip}</span></span>
                    <span className="font-mono text-faint">field: payload</span>
                </div>
                <div className="mt-3 break-all rounded-[12px] bg-scope p-4 font-mono text-[14px] text-readout">
                    <Highlighted
                        text={payloadOf(sqli)}
                        regex={/'\s*(?:or|and)\s+'([^']*)'\s*=\s*'\1/i}
                        color={severityOf(sqli.severity).color}
                    />
                </div>
                <p className="mt-4 text-muted">
                    Matched technique: <span className="text-readout">quoted tautology</span>. The condition
                    <span className="font-mono"> '1'='1' </span>is always true, so a login query that includes it
                    can return a user without a valid password.
                </p>
            </div>
        ),
    },
];

function HowItWorks() {
    const [step, setStep] = useState(0);
    const Example = STEPS[step].example;

    return (
        <section id="how" className="mx-auto max-w-[1240px] scroll-mt-16 px-4 py-24 sm:px-6 lg:px-8">
            <h2 className="font-display text-4xl font-semibold leading-tight text-readout sm:text-5xl">
                What happens to an uploaded file
            </h2>

            <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
                <ol className="flex flex-col gap-2" aria-label="Steps">
                    {STEPS.map((s, i) => (
                        <li key={s.title}>
                            <button
                                type="button"
                                onClick={() => setStep(i)}
                                aria-pressed={step === i}
                                className={`w-full rounded-[var(--radius-panel)] border px-5 py-4 text-left transition-colors ${step === i ? "border-graticule-hi bg-bezel" : "border-transparent hover:bg-bezel/60"}`}
                            >
                                <div className="flex items-baseline gap-3">
                                    <span className={`font-display text-lg font-semibold tabular-nums ${step === i ? "text-phosphor" : "text-faint"}`}>
                                        {i + 1}
                                    </span>
                                    <span className="font-display text-2xl font-semibold text-readout">{s.title}</span>
                                </div>
                                {step === i && <p className="mt-2 pl-7 text-[15px] text-muted">{s.text}</p>}
                            </button>
                        </li>
                    ))}
                </ol>

                <div className="min-h-[340px] rounded-[var(--radius-panel)] border border-graticule bg-bezel p-6 sm:p-8 lg:sticky lg:top-24">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.18 }}
                        >
                            <Example />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}

// ---- Detectors bento -----------------------------------------------------
function Tile({ className = "", name, mitre, rule, children }) {
    return (
        <article className={`flex flex-col rounded-[var(--radius-panel)] border border-graticule bg-bezel p-6 ${className}`}>
            <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-2xl font-semibold text-readout">{name}</h3>
                <span className="font-mono text-sm text-faint">{mitre}</span>
            </div>
            <p className="mt-2 max-w-[60ch] text-muted">{rule}</p>
            <div className="mt-6 flex-1">{children}</div>
        </article>
    );
}

function BruteForceDiagram() {
    // 10-minute strip around the attack; the 5-minute window is bracketed.
    const start = bruteForceFailures[0].t - 120;
    const span = 600;
    const fraction = (t) => (t - start) / span;
    return (
        <div className="relative h-36 rounded-[12px] bg-scope px-4">
            <div className="absolute inset-x-4 top-1/2 h-px bg-graticule-hi" />
            <div
                className="absolute top-7 bottom-7 rounded-[10px] border border-dashed border-phosphor/50"
                style={{
                    left: `calc(16px + (100% - 32px) * ${fraction(bruteForceFailures[0].t)} - 10px)`,
                    width: `calc((100% - 32px) * ${300 / span} + 20px)`,
                }}
            >
                <span className="absolute -top-5 left-0 text-xs text-phosphor">5-minute window</span>
            </div>
            {bruteForceFailures.map((e) => (
                <span
                    key={e.time}
                    title={`${e.time} login failed`}
                    className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sev-critical"
                    style={{ left: `calc(16px + (100% - 32px) * ${(e.t - start) / span})` }}
                />
            ))}
            {bruteForceSuccess && (
                <span
                    title={`${bruteForceSuccess.time} login succeeded`}
                    className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-phosphor"
                    style={{ left: `calc(16px + (100% - 32px) * ${(bruteForceSuccess.t - start) / span})` }}
                />
            )}
            <div className="absolute inset-x-4 bottom-2 flex justify-between font-mono text-[11px] text-faint">
                <span>{bruteForceFailures[0].time.slice(0, 5)}</span>
                <span>failed logins, then a successful one</span>
            </div>
        </div>
    );
}

function Detectors() {
    return (
        <section id="detectors" className="mx-auto max-w-[1240px] scroll-mt-24 px-4 pb-24 sm:px-6 lg:px-8">
            <h2 className="font-display text-4xl font-semibold leading-tight text-readout sm:text-5xl">
                Four detectors, each one rule you can read
            </h2>

            <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-6">
                <Tile
                    className="lg:col-span-4"
                    name="Brute force"
                    mitre="T1110"
                    rule="Five or more failed logins from one IP inside any 5-minute window. If that IP then logs in successfully, the alert becomes Critical."
                >
                    <BruteForceDiagram />
                </Tile>

                <Tile
                    className="lg:col-span-2"
                    name="Port scan"
                    mitre="T1046"
                    rule="Ten or more different ports probed by one IP within 60 seconds."
                >
                    <div className="grid grid-cols-5 gap-1.5">
                        {COMMON_PORTS.map((port) => {
                            const hit = probedPorts.has(String(port));
                            return (
                                <span
                                    key={port}
                                    className={`rounded-[6px] py-1.5 text-center font-mono text-[12px] ${hit ? "bg-sev-medium/15 text-sev-medium" : "bg-scope text-faint"}`}
                                >
                                    {port}
                                </span>
                            );
                        })}
                    </div>
                    <p className="mt-3 text-sm text-faint">
                        Highlighted: the {probedPorts.size} ports {portScan.ip} touched in the sample day.
                    </p>
                </Tile>

                <Tile
                    className="lg:col-span-3"
                    name="SQL injection"
                    mitre="T1190"
                    rule="Request data that contains SQL structure: tautologies, UNION SELECT, stacked queries, SLEEP(), schema lookups. URL-encoded payloads are decoded first."
                >
                    <div className="break-all rounded-[12px] bg-scope p-4 font-mono text-[13px] text-readout">
                        <Highlighted text={payloadOf(sqli)} regex={/'\s*(?:or|and)\s+'([^']*)'\s*=\s*'\1/i} color={severityOf("High").color} />
                    </div>
                    <p className="mt-3 text-sm text-faint">
                        Not flagged: <span className="font-mono">/docs#install</span>, <span className="font-mono">c# tutorial</span>, "build -- passed".
                    </p>
                </Tile>

                <Tile
                    className="lg:col-span-3"
                    name="Cross-site scripting"
                    mitre="T1059.007"
                    rule="Script tags, event handlers such as onerror=, javascript: links and cookie access in request data."
                >
                    <div className="break-all rounded-[12px] bg-scope p-4 font-mono text-[13px] text-readout">
                        <Highlighted text={payloadOf(xss)} regex={/<[^>]*\bon(?:error|load|click|mouseover|focus|mouseenter)\s*=/i} color={severityOf("High").color} />
                    </div>
                    <p className="mt-3 text-sm text-faint">
                        Not flagged: a plain <span className="font-mono">{"<img src='/images/avatar.png'>"}</span>.
                    </p>
                </Tile>

                <article className="flex flex-col gap-5 rounded-[var(--radius-panel)] border border-dashed border-graticule-hi p-6 lg:col-span-6 lg:flex-row lg:items-center">
                    <div className="lg:w-[38%]">
                        <h3 className="font-display text-2xl font-semibold text-readout">Adding a fifth</h3>
                        <p className="mt-2 text-muted">
                            A detector is one Python class. List it in the registry and the engine, the API and this
                            app pick it up. Command injection, credential stuffing and impossible travel are next.
                        </p>
                    </div>
                    <pre className="scrollbar-thin flex-1 overflow-x-auto rounded-[12px] bg-bezel p-4 font-mono text-[13px] leading-relaxed text-muted">
{`class CommandInjectionDetector(PatternDetector):
    id = "command_injection"
    PATTERNS = [("Command chaining", re.compile(r"[;&|]\\s*(ls|cat|whoami)\\b"))]
    SEARCH_FIELDS = ["url", "payload", "command"]`}
                    </pre>
                </article>
            </div>
        </section>
    );
}

// ---- Page -----------------------------------------------------------------
export default function Landing() {
    const signedIn = isAuthenticated();

    return (
        <div className="min-h-screen bg-scope">
            <header className="glass sticky top-0 z-40 rounded-none border-x-0 border-t-0">
                <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-4 sm:px-6 lg:px-8">
                    <a href="#top" aria-label="ThreatEye home"><Logo /></a>
                    <nav className="hidden gap-6 text-[15px] text-muted md:flex" aria-label="Page sections">
                        <a href="#replay" className="hover:text-readout">Replay</a>
                        <a href="#how" className="hover:text-readout">How it works</a>
                        <a href="#detectors" className="hover:text-readout">Detectors</a>
                        <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-readout">Source code</a>
                    </nav>
                    <div className="ml-auto flex items-center gap-2">
                        {signedIn ? (
                            <Button to="/dashboard" variant="primary">Open dashboard</Button>
                        ) : (
                            <>
                                <Button to="/login" variant="ghost">Sign in</Button>
                                <Button to="/signup" variant="primary">Create account</Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main id="top">
                <section className="graticule border-b border-graticule">
                    <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pt-20">
                        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end">
                            <h1 className="font-display text-[clamp(44px,6.6vw,84px)] font-semibold leading-[0.95] tracking-[-0.01em] text-balance text-readout">
                                Find the attacks in your security logs
                            </h1>
                            <div className="max-w-[52ch]">
                                <p className="text-lg text-muted">
                                    Upload a log file and ThreatEye checks it for brute-force logins, port scans, SQL
                                    injection and cross-site scripting. Every alert shows the rows behind it and how its
                                    score was worked out.
                                </p>
                                <div className="mt-6 flex flex-wrap gap-3">
                                    {signedIn ? (
                                        <Button to="/dashboard" variant="primary" size="lg">Open dashboard</Button>
                                    ) : (
                                        <>
                                            <Button to="/signup" variant="primary" size="lg">Create account</Button>
                                            <Button to="/login" size="lg">Sign in</Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div id="replay" className="mt-14 scroll-mt-24">
                            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                                <h2 className="font-display text-2xl font-semibold text-readout">A sample day, replayed</h2>
                                <p className="text-sm text-faint">
                                    {day.events.length} rows from <span className="font-mono text-muted">{day.source}</span>. Alerts appear when ThreatEye's detectors raise them.
                                </p>
                            </div>
                            <ReplayScope mode="full" />
                        </div>
                    </div>
                </section>

                <HowItWorks />
                <Detectors />
            </main>

            <footer className="border-t border-graticule">
                <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-4 py-10 text-sm text-faint sm:px-6 md:flex-row md:items-center lg:px-8">
                    <Logo size={22} />
                    <p className="max-w-[70ch] md:ml-6">
                        Detection is rule-based and runs on files you upload. Live ingestion, saved incidents and
                        threat-intelligence lookups are on the roadmap.
                    </p>
                    <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-muted hover:text-readout md:ml-auto">
                        Source code on GitHub
                    </a>
                </div>
            </footer>
        </div>
    );
}
