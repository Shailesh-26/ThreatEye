import { Database, LayoutGrid, Radar, ShieldAlert } from "lucide-react";

// The pages inside the app. Sidebar and command palette both read this list.
export const NAV_ITEMS = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutGrid, description: "Today's alerts and activity" },
    { to: "/logs", label: "Logs", icon: Database, description: "Upload and browse log rows" },
    { to: "/alerts", label: "Alerts", icon: ShieldAlert, description: "Investigate detected attacks" },
    { to: "/detections", label: "Detections", icon: Radar, description: "Rules and manual runs" },
];

export const API_DOCS_URL = "http://127.0.0.1:8000/docs";
