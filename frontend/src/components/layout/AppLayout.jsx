import { useEffect, useState } from "react";

import CommandPalette from "./CommandPalette";
import SignOutDialog from "./SignOutDialog";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const SIDEBAR_KEY = "threateye.sidebarExpanded";

function readExpanded() {
    try {
        return localStorage.getItem(SIDEBAR_KEY) !== "false";
    } catch {
        return true;
    }
}

export default function AppLayout({ children, session }) {
    const [expanded, setExpanded] = useState(readExpanded);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setPaletteOpen((o) => !o);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    function toggleSidebar() {
        setExpanded((value) => {
            try {
                localStorage.setItem(SIDEBAR_KEY, String(!value));
            } catch {
                // Storage blocked - the toggle still works for this visit.
            }
            return !value;
        });
    }

    return (
        <div className="flex min-h-screen bg-scope">
            <Sidebar expanded={expanded} onToggle={toggleSidebar} />
            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar
                    onOpenPalette={() => setPaletteOpen(true)}
                    remainingTime={session.remainingTime}
                    onExtend={session.extendSession}
                    onSignOut={() => setSigningOut(true)}
                />
                <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
            </div>
            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onSignOut={() => setSigningOut(true)} />
            <SignOutDialog open={signingOut} onClose={() => setSigningOut(false)} />
        </div>
    );
}
