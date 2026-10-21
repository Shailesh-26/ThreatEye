import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

import Logo from "../ui/Logo";
import Radar from "../radar/Radar";
import day from "../../data/sampleDay.json";
import { sampleContacts } from "../../lib/contacts";
import { severityOf } from "../../lib/severity";

/**
 * Sign-in / sign-up frame: a full-screen radar of the sample day with the
 * form floating over it on glass. The card tilts slightly with the pointer.
 */
const contacts = sampleContacts();
const attackers = contacts.filter((c) => c.severity).sort((a, b) => b.risk - a.risk);

export default function AuthLayout({ title, subtitle, children, footer }) {
    const reduceMotion = useReducedMotion();

    const px = useMotionValue(0);
    const py = useMotionValue(0);
    const rotateY = useSpring(useTransform(px, [-1, 1], [-5, 5]), { stiffness: 120, damping: 20 });
    const rotateX = useSpring(useTransform(py, [-1, 1], [4, -4]), { stiffness: 120, damping: 20 });

    useEffect(() => {
        if (reduceMotion) return undefined;
        const onMove = (e) => {
            px.set((e.clientX / window.innerWidth) * 2 - 1);
            py.set((e.clientY / window.innerHeight) * 2 - 1);
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
    }, [px, py, reduceMotion]);

    return (
        <div className="graticule relative min-h-screen overflow-hidden bg-scope">
            {/* radar fills the screen behind the card */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 w-[min(135vw,135vh,1180px)] -translate-x-1/2 -translate-y-1/2 opacity-90 lg:w-[min(96vw,118vh,1180px)]">
                <Radar contacts={contacts} interactive={false} centre={<span />} />
            </div>

            {/* HUD: corners carry real information about what's on the radar */}
            <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
                <Link to="/" aria-label="ThreatEye home"><Logo /></Link>
                <Link to="/" className="text-sm text-muted hover:text-readout">About ThreatEye</Link>
            </header>

            <aside className="absolute bottom-6 left-6 z-10 hidden max-w-[280px] text-sm text-faint sm:left-10 md:block">
                <p>
                    Contacts from <span className="font-mono text-muted">{day.source}</span>. Closer to the centre
                    means higher risk.
                </p>
            </aside>

            <aside className="absolute bottom-6 right-6 z-10 hidden w-[300px] sm:right-10 lg:block" aria-label="Attackers on the radar">
                <ul className="space-y-2 text-sm">
                    {attackers.map((c) => (
                        <li key={c.ip} className="flex items-center gap-3">
                            <span className="h-2 w-2 rotate-45" style={{ background: severityOf(c.severity).color }} />
                            <span className="font-mono text-readout">{c.ip}</span>
                            <span className="truncate text-faint">{c.label}</span>
                        </li>
                    ))}
                </ul>
            </aside>

            <main className="relative z-10 flex min-h-[calc(100vh-88px)] items-center justify-center px-4 pb-16" style={{ perspective: 1200 }}>
                <motion.div
                    style={reduceMotion ? undefined : { rotateX, rotateY }}
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 140, damping: 20 }}
                    className="glass w-full max-w-[420px] rounded-[var(--radius-sheet)] p-7 sm:p-9"
                >
                    <h1 className="font-display text-4xl font-semibold text-readout">{title}</h1>
                    {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
                    <div className="mt-7">{children}</div>
                    {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
                </motion.div>
            </main>
        </div>
    );
}
