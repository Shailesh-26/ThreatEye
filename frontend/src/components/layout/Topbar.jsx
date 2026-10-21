import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, LogOut, MonitorSmartphone, Search, UserRound } from "lucide-react";
import { toast } from "sonner";

import Button from "../ui/Button";
import Kbd from "../ui/Kbd";
import { LogoMark } from "../ui/Logo";
import usePopover from "../../hooks/usePopover";
import { PROFILE_UPDATED } from "../../lib/events";
import { getCurrentUser } from "../../services/authService";
import { getSessionExpiry } from "../../services/sessionService";
import { NAV_ITEMS } from "./navigation";

function Menu({ open, children, className = "" }) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.14 }}
                    className={`glass absolute right-0 top-12 z-40 rounded-[18px] p-2 ${className}`}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

const itemClass = "flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left text-muted transition-colors hover:bg-plate hover:text-readout";

function SessionMenu({ remainingTime, onExtend }) {
    const { open, setOpen, ref } = usePopover();
    const minutes = Math.max(0, Math.ceil(remainingTime / 60000));
    const low = remainingTime <= 5 * 60 * 1000;
    const expiry = getSessionExpiry();
    const width = Math.min(100, (remainingTime / (30 * 60 * 1000)) * 100);

    async function extend() {
        const ok = await onExtend();
        if (ok) toast.success("Session extended", { description: "You have a fresh 30 minutes." });
        else toast.error("Couldn't extend the session", { description: "Sign in again to continue." });
    }

    return (
        <div className="relative hidden sm:block" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-haspopup="menu"
                className={`flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition-colors ${low ? "border-sev-medium/40 text-sev-medium hover:bg-sev-medium/10" : "border-graticule text-muted hover:border-graticule-hi hover:bg-plate hover:text-readout"} ${open ? "bg-plate text-readout" : ""}`}
            >
                <span className={`h-1.5 w-1.5 rounded-full ${low ? "bg-sev-medium" : "bg-phosphor"}`} />
                <span className="tabular-nums">{minutes} min</span>
            </button>
            <Menu open={open} className="w-72">
                <div className="px-3 pb-3 pt-2">
                    <div className="text-sm text-muted">Session time left</div>
                    <div className="mt-1 font-display text-3xl font-semibold tabular-nums text-readout">{minutes} min</div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-scope">
                        <div className={`h-full rounded-full ${low ? "bg-sev-medium" : "bg-phosphor"}`} style={{ width: `${width}%` }} />
                    </div>
                    {expiry && (
                        <p className="mt-2 text-xs text-faint">
                            Ends at {new Date(expiry).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}. You get a warning 2 minutes before.
                        </p>
                    )}
                    <Button variant="primary" size="sm" className="mt-3 w-full" onClick={extend}>Extend to 30 minutes</Button>
                </div>
                <div className="my-1 h-px bg-graticule" />
                <Link to="/profile#sessions" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
                    <MonitorSmartphone size={16} /> Signed-in devices
                </Link>
            </Menu>
        </div>
    );
}

function UserMenu({ onSignOut }) {
    const [user, setUser] = useState(null);
    const { open, setOpen, ref } = usePopover();

    useEffect(() => {
        const load = () => getCurrentUser().then(setUser).catch(() => setUser(null));
        load();
        window.addEventListener(PROFILE_UPDATED, load);
        return () => window.removeEventListener(PROFILE_UPDATED, load);
    }, []);

    const initial = (user?.username || user?.email || "?").charAt(0).toUpperCase();
    const close = () => setOpen(false);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label="Account menu"
                className={`flex h-9 w-9 items-center justify-center rounded-full border bg-plate font-display font-semibold text-readout transition-colors hover:border-phosphor/70 ${open ? "border-phosphor/70" : "border-graticule-hi"}`}
            >
                {initial}
            </button>
            <Menu open={open} className="w-64">
                <Link to="/profile" onClick={close} className="block rounded-[10px] px-3 py-2 hover:bg-plate">
                    <div className="font-medium text-readout">{user?.username ?? "Signed in"}</div>
                    <div className="truncate text-sm text-faint">{user?.email}</div>
                </Link>
                <div className="my-1 h-px bg-graticule" />
                <Link to="/profile" role="menuitem" onClick={close} className={itemClass}><UserRound size={16} /> Profile and password</Link>
                <Link to="/profile#sessions" role="menuitem" onClick={close} className={itemClass}><MonitorSmartphone size={16} /> Signed-in devices</Link>
                <Link to="/profile#shortcuts" role="menuitem" onClick={close} className={itemClass}><Keyboard size={16} /> Keyboard shortcuts</Link>
                <div className="my-1 h-px bg-graticule" />
                <button type="button" role="menuitem" onClick={() => { close(); onSignOut(); }} className={itemClass}>
                    <LogOut size={16} /> Sign out
                </button>
            </Menu>
        </div>
    );
}

export default function Topbar({ onOpenPalette, remainingTime, onExtend, onSignOut }) {
    const { pathname } = useLocation();
    const current = [...NAV_ITEMS, { to: "/profile", label: "Profile" }].find((item) => pathname.startsWith(item.to));

    return (
        <header className="sticky top-0 z-30 border-b border-graticule bg-scope/85 backdrop-blur-md">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
                <Link to="/dashboard" aria-label="ThreatEye dashboard" className="md:hidden"><LogoMark size={24} /></Link>
                <h1 className="font-display text-xl font-semibold text-readout sm:text-2xl">
                    {current?.label ?? "ThreatEye"}
                </h1>

                <button
                    type="button"
                    onClick={onOpenPalette}
                    className="ml-auto flex h-9 items-center gap-2.5 rounded-full border border-graticule bg-bezel pl-3 pr-2 text-sm text-faint transition-colors hover:border-graticule-hi hover:text-muted sm:w-72"
                    aria-label="Open command palette"
                >
                    <Search size={15} />
                    <span className="hidden sm:inline">Go to, run or upload</span>
                    <span className="ml-auto hidden items-center gap-1 sm:flex"><Kbd>Ctrl</Kbd><Kbd>K</Kbd></span>
                </button>

                <SessionMenu remainingTime={remainingTime} onExtend={onExtend} />
                <UserMenu onSignOut={onSignOut} />
            </div>

            {/* Mobile navigation */}
            <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden" aria-label="Main">
                {NAV_ITEMS.map(({ to, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `shrink-0 rounded-full px-3 py-1.5 text-sm ${isActive ? "bg-plate text-readout" : "text-muted"}`
                        }
                    >
                        {label}
                    </NavLink>
                ))}
            </nav>
        </header>
    );
}
