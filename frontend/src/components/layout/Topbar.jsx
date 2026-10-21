import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LogOut, Search } from "lucide-react";

import Kbd from "../ui/Kbd";
import { LogoMark } from "../ui/Logo";
import { getCurrentUser } from "../../services/authService";
import { NAV_ITEMS } from "./navigation";

function SessionTimer({ remainingTime, onExtend }) {
    const minutes = Math.max(0, Math.ceil(remainingTime / 60000));
    const low = remainingTime <= 5 * 60 * 1000;
    return (
        <button
            type="button"
            onClick={onExtend}
            title="Time until you're signed out. Click to extend."
            className={`hidden h-9 items-center gap-2 rounded-full border px-3 text-sm transition-colors sm:flex ${low ? "border-sev-medium/40 text-sev-medium hover:bg-sev-medium/10" : "border-graticule text-muted hover:border-graticule-hi hover:text-readout"}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${low ? "bg-sev-medium" : "bg-phosphor"}`} />
            <span className="tabular-nums">{minutes} min</span>
        </button>
    );
}

function UserMenu({ onSignOut }) {
    const [user, setUser] = useState(null);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        getCurrentUser().then(setUser).catch(() => setUser(null));
    }, []);

    useEffect(() => {
        if (!open) return undefined;
        const onClick = (e) => {
            if (!ref.current?.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        window.addEventListener("mousedown", onClick);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("mousedown", onClick);
            window.removeEventListener("keydown", onKey);
        };
    }, [open]);

    function signOut() {
        setOpen(false);
        onSignOut();
    }

    const initial = (user?.username || user?.email || "?").charAt(0).toUpperCase();

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-haspopup="menu"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-graticule-hi bg-plate font-display font-semibold text-readout transition-colors hover:border-phosphor/60"
            >
                {initial}
            </button>
            {open && (
                <div role="menu" className="glass absolute right-0 top-11 z-40 w-64 rounded-[18px] p-2">
                    <div className="px-3 py-2">
                        <div className="font-medium text-readout">{user?.username ?? "Signed in"}</div>
                        <div className="truncate text-sm text-faint">{user?.email}</div>
                    </div>
                    <div className="my-1 h-px bg-graticule" />
                    <button
                        type="button"
                        role="menuitem"
                        onClick={signOut}
                        className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left text-muted transition-colors hover:bg-plate hover:text-readout"
                    >
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
            )}
        </div>
    );
}

export default function Topbar({ onOpenPalette, remainingTime, onExtend, onSignOut }) {
    const { pathname } = useLocation();
    const current = NAV_ITEMS.find((item) => pathname.startsWith(item.to));

    return (
        <header className="sticky top-0 z-30 border-b border-graticule bg-scope/85 backdrop-blur-md">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
                <span className="md:hidden"><LogoMark size={24} /></span>
                <h1 className="font-display text-xl font-semibold text-readout sm:text-2xl">
                    {current?.label ?? "ThreatEye"}
                </h1>

                <button
                    type="button"
                    onClick={onOpenPalette}
                    className="ml-auto flex h-9 items-center gap-2.5 rounded-full border border-graticule bg-bezel pl-3 pr-2 text-sm text-faint transition-colors hover:border-graticule-hi hover:text-muted sm:w-72"
                >
                    <Search size={15} />
                    <span className="hidden sm:inline">Go to, run or upload</span>
                    <span className="ml-auto hidden items-center gap-1 sm:flex"><Kbd>Ctrl</Kbd><Kbd>K</Kbd></span>
                </button>

                <SessionTimer remainingTime={remainingTime} onExtend={onExtend} />
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
