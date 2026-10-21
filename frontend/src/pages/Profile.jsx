import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Laptop, Smartphone } from "lucide-react";
import { toast } from "sonner";

import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import Kbd from "../components/ui/Kbd";
import Skeleton from "../components/ui/Skeleton";
import Tile from "../components/ui/Tile";
import { dateOf, timeOf } from "../lib/format";
import { announceProfileUpdated } from "../lib/events";
import {
    changePassword,
    errorMessage,
    getCurrentUser,
    listSessions,
    revokeOtherSessions,
    revokeSession,
    updateProfile,
} from "../services/authService";

function relative(iso) {
    if (!iso) return "";
    const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`;
    return `${Math.round(seconds / 86400)} days ago`;
}

// ---- Account -------------------------------------------------------------------
function Account({ user, onSaved }) {
    const [name, setName] = useState(user.username);
    const [saving, setSaving] = useState(false);
    const changed = name.trim() !== user.username;

    async function save(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await updateProfile(name.trim());
            toast.success("Name saved", { description: `You're now shown as ${updated.username}.` });
            announceProfileUpdated();
            onSaved(updated);
        } catch (error) {
            toast.error("Name not saved", { description: errorMessage(error, "Try again.") });
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={save} className="space-y-5">
            <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-graticule-hi bg-plate font-display text-3xl font-semibold text-phosphor">
                    {(name || user.email).charAt(0).toUpperCase()}
                </span>
                <div>
                    <div className="font-display text-2xl font-semibold text-readout">{user.username}</div>
                    <div className="text-muted">{user.email}</div>
                    {user.created_at && <div className="text-sm text-faint">Member since {dateOf(user.created_at)}</div>}
                </div>
            </div>
            <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} hint="Shown in the top bar. 2 to 40 characters." autoComplete="name" />
            <Field label="Email" value={user.email} disabled hint="Your sign-in email can't be changed here." />
            <Button type="submit" variant="primary" disabled={!changed || saving || name.trim().length < 2}>
                {saving ? "Saving" : "Save name"}
            </Button>
        </form>
    );
}

// ---- Password --------------------------------------------------------------------
function Password({ user, onChanged }) {
    const [form, setForm] = useState({ current: "", next: "", confirm: "" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    const problems = {
        next: form.next && form.next.length < 8 ? "Use at least 8 characters." : undefined,
        confirm: form.confirm && form.confirm !== form.next ? "The passwords don't match." : undefined,
    };
    const ready = form.current && form.next.length >= 8 && form.confirm === form.next;

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            const result = await changePassword(form.current, form.next);
            toast.success("Password changed", {
                description: result.signed_out_sessions
                    ? `${result.signed_out_sessions} other device${result.signed_out_sessions === 1 ? " was" : "s were"} signed out.`
                    : "No other devices were signed in.",
            });
            setForm({ current: "", next: "", confirm: "" });
            onChanged();
        } catch (err) {
            setError(errorMessage(err, "The password wasn't changed."));
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={submit} className="space-y-5" noValidate>
            <p className="text-sm text-muted">
                Changing your password signs out every other device. This browser stays signed in.
                {user.password_changed_at && ` Last changed ${dateOf(user.password_changed_at)}.`}
            </p>
            <Field label="Current password" type="password" autoComplete="current-password" value={form.current} onChange={set("current")} />
            <Field label="New password" type="password" autoComplete="new-password" value={form.next} onChange={set("next")} error={problems.next} hint="At least 8 characters." />
            <Field label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} error={problems.confirm} />
            {error && <p role="alert" className="rounded-[var(--radius-control)] border border-sev-critical/30 bg-sev-critical/10 px-3.5 py-2.5 text-sm text-sev-critical">{error}</p>}
            <Button type="submit" variant="primary" disabled={!ready || busy}>{busy ? "Changing" : "Change password"}</Button>
        </form>
    );
}

// ---- Sessions ----------------------------------------------------------------------
function Sessions({ refreshKey }) {
    const [sessions, setSessions] = useState(null);
    const [busy, setBusy] = useState(null);

    const load = useCallback(() => listSessions().then(setSessions).catch(() => setSessions([])), []);
    useEffect(() => {
        load();
    }, [load, refreshKey]);

    async function signOut(session) {
        setBusy(session.id);
        try {
            await revokeSession(session.id);
            toast.success(`${session.device} signed out`);
            load();
        } catch (error) {
            toast.error("That device wasn't signed out", { description: errorMessage(error, "Try again.") });
        } finally {
            setBusy(null);
        }
    }

    async function signOutOthers() {
        setBusy("others");
        try {
            const { revoked } = await revokeOtherSessions();
            toast.success(revoked ? `Signed out ${revoked} other device${revoked === 1 ? "" : "s"}` : "No other devices were signed in");
            load();
        } finally {
            setBusy(null);
        }
    }

    if (!sessions) return <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>;

    const others = sessions.filter((s) => !s.current).length;

    return (
        <div>
            <ul className="space-y-2">
                <AnimatePresence initial={false}>
                    {sessions.map((s) => {
                        const Icon = /android|iphone|ipad/i.test(s.device) ? Smartphone : Laptop;
                        return (
                            <motion.li
                                key={s.id}
                                layout
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 24 }}
                                className={`flex items-center gap-4 rounded-[14px] border px-4 py-3 ${s.current ? "border-phosphor/40 bg-phosphor/5" : "border-graticule bg-scope/60"}`}
                            >
                                <Icon size={20} className={s.current ? "text-phosphor" : "text-muted"} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-readout">{s.device}</span>
                                        {s.current && <span className="rounded-full bg-phosphor/15 px-2 py-0.5 text-xs text-phosphor">This browser</span>}
                                    </div>
                                    <div className="text-sm text-faint">
                                        {s.ip_address && <span className="font-mono">{s.ip_address}</span>}
                                        {s.ip_address && ", "}signed in {dateOf(s.created_at)} at {timeOf(s.created_at)}, active {relative(s.last_used_at)}
                                    </div>
                                </div>
                                {!s.current && (
                                    <Button size="sm" variant="ghost" onClick={() => signOut(s)} disabled={busy === s.id}>
                                        {busy === s.id ? "Signing out" : "Sign out"}
                                    </Button>
                                )}
                            </motion.li>
                        );
                    })}
                </AnimatePresence>
            </ul>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-faint">
                    {sessions.length} active session{sessions.length === 1 ? "" : "s"}. Each one is a sign-in that can still renew itself for up to 30 days.
                </p>
                <Button variant="danger" size="sm" onClick={signOutOthers} disabled={!others || busy === "others"}>
                    Sign out all other devices
                </Button>
            </div>
        </div>
    );
}

// ---- Shortcuts ------------------------------------------------------------------------
const SHORTCUTS = [
    [["Ctrl", "K"], "Open the command palette from any page"],
    [["/"], "Jump to the search box on Logs"],
    [["J"], "Next alert on the Alerts page"],
    [["K"], "Previous alert on the Alerts page"],
    [["Esc"], "Close a dialog, menu or side panel"],
    [["Space"], "Play or pause the replay on the landing page"],
];

export default function Profile() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [sessionsKey, setSessionsKey] = useState(0);
    const { hash } = useLocation();

    useEffect(() => {
        getCurrentUser().then(setUser).catch(setError);
    }, []);

    // Links like /profile#sessions scroll to that section.
    useEffect(() => {
        if (!user || !hash) return;
        requestAnimationFrame(() => {
            const el = document.getElementById(hash.slice(1));
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
            el?.classList.add("locate");
            setTimeout(() => el?.classList.remove("locate"), 1900);
        });
    }, [user, hash]);

    if (error) return <Tile title="Your profile couldn't load"><p className="text-muted">{errorMessage(error, "Try again.")}</p></Tile>;
    if (!user) return <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>;

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-12">
            <Tile id="account" className="scroll-mt-24 lg:col-span-5" title="Account">
                <Account key={user.username} user={user} onSaved={(u) => setUser({ ...user, ...u })} />
            </Tile>
            <Tile id="password" className="scroll-mt-24 lg:col-span-7" title="Password">
                <Password user={user} onChanged={() => setSessionsKey((k) => k + 1)} />
            </Tile>
            <Tile id="sessions" className="scroll-mt-24 lg:col-span-12" title="Signed-in devices">
                <Sessions refreshKey={sessionsKey} />
            </Tile>
            <Tile id="shortcuts" className="scroll-mt-24 lg:col-span-12" title="Keyboard shortcuts">
                <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                    {SHORTCUTS.map(([keys, what]) => (
                        <li key={what} className="flex items-center gap-3 text-sm">
                            <span className="flex min-w-[72px] gap-1">{keys.map((k) => <Kbd key={k}>{k}</Kbd>)}</span>
                            <span className="text-muted">{what}</span>
                        </li>
                    ))}
                </ul>
            </Tile>
        </div>
    );
}
