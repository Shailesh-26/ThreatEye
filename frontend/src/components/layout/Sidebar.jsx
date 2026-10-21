import { NavLink } from "react-router-dom";
import { BookOpen, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { LogoMark } from "../ui/Logo";
import { API_DOCS_URL, NAV_ITEMS } from "./navigation";

export default function Sidebar({ expanded, onToggle }) {
    return (
        <aside
            className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-graticule bg-bezel transition-[width] duration-200 md:flex ${expanded ? "w-56" : "w-[68px]"}`}
        >
            <div className="flex h-16 items-center gap-2.5 px-5">
                <LogoMark size={26} />
                {expanded && (
                    <span className="font-display text-[19px] font-semibold text-readout">ThreatEye</span>
                )}
            </div>

            <nav className="mt-4 flex flex-1 flex-col gap-1 px-3" aria-label="Main">
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        title={expanded ? undefined : label}
                        className={({ isActive }) =>
                            [
                                "group relative flex h-10 items-center gap-3 rounded-[var(--radius-control)] px-3 text-[15px] transition-colors",
                                isActive ? "bg-plate text-readout" : "text-muted hover:bg-plate/60 hover:text-readout",
                            ].join(" ")
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <span className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r-full bg-phosphor" aria-hidden="true" />
                                )}
                                <Icon size={18} className={isActive ? "text-phosphor" : ""} />
                                {expanded && <span>{label}</span>}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="flex flex-col gap-1 border-t border-graticule px-3 py-3">
                <a
                    href={API_DOCS_URL}
                    target="_blank"
                    rel="noreferrer"
                    title={expanded ? undefined : "API docs"}
                    className="flex h-10 items-center gap-3 rounded-[var(--radius-control)] px-3 text-[15px] text-muted transition-colors hover:bg-plate/60 hover:text-readout"
                >
                    <BookOpen size={18} />
                    {expanded && <span>API docs</span>}
                </a>
                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
                    className="flex h-10 items-center gap-3 rounded-[var(--radius-control)] px-3 text-[15px] text-muted transition-colors hover:bg-plate/60 hover:text-readout"
                >
                    {expanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                    {expanded && <span>Collapse</span>}
                </button>
            </div>
        </aside>
    );
}
