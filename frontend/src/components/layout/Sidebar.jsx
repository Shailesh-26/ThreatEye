import {
    LayoutDashboard,
    Database,
    ShieldAlert,
    Radar,
    Clock3,
    FileText,
    Settings,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menu = [
    {
        name: "Dashboard",
        icon: LayoutDashboard,
        path: "/",
    },
    {
        name: "Logs",
        icon: Database,
        path: "/logs",
    },
    {
        name: "Alerts",
        icon: ShieldAlert,
        path: "/alerts",
    },
    {
        name: "Detections",
        icon: Radar,
        path: "/detections",
    },
    {
        name: "Timeline",
        icon: Clock3,
        path: "/timeline",
    },
    {
        name: "Reports",
        icon: FileText,
        path: "/reports",
    },
    {
        name: "Settings",
        icon: Settings,
        path: "/settings",
    },
];

export default function Sidebar() {
    return (
        <aside className="w-72 bg-[#090d10] border-r border-green-500/10 flex flex-col">

            <div className="px-6 py-8">

                <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-black font-bold shadow-[0_0_30px_rgba(34,197,94,.6)]">
                        T
                    </div>

                    <div>

                        <h1 className="text-2xl font-bold text-green-400">
                            ThreatEye
                        </h1>

                        <p className="text-sm text-zinc-500">
                            Cyber Threat Hunting
                        </p>

                    </div>

                </div>

            </div>

            <nav className="flex-1 px-4">

                {menu.map((item) => {

                    const Icon = item.icon;

                    return (

                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === "/"}
                            className={({ isActive }) =>
                                `
                                flex items-center gap-4
                                px-5 py-4
                                rounded-xl
                                mb-3
                                transition-all
                                duration-300

                                ${
                                    isActive
                                        ? "bg-green-500/10 text-green-400 shadow-[0_0_20px_rgba(34,197,94,.15)]"
                                        : "text-zinc-400 hover:text-green-400 hover:bg-zinc-900"
                                }
                                `
                            }
                        >
                            <Icon size={20} />

                            <span>{item.name}</span>

                        </NavLink>

                    );

                })}

            </nav>

            <div className="p-6 border-t border-green-500/10">

                <div className="flex items-center gap-3">

                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />

                    <span className="text-green-400">
                        System Online
                    </span>

                </div>

            </div>

        </aside>
    );
}