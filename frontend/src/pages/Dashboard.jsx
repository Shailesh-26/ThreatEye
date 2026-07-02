import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Database, ShieldAlert, UserX, Globe } from "lucide-react";

import { getDashboard } from "../services/dashboardService";
import StatCard from "../components/cards/StatCard";

export default function Dashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadDashboard() {
            try {
                const data = await getDashboard();
                setDashboard(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load dashboard");
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);

    if (loading) {
        return (
            <h2 className="text-2xl text-zinc-400">
                Loading dashboard...
            </h2>
        );
    }

    if (error) {
        return (
            <h2 className="text-red-400">
                {error}
            </h2>
        );
    }

    return (
        <>
            <h1 className="text-6xl font-bold">
                Dashboard
            </h1>

            <p className="text-zinc-400 mt-3">
                Live overview of your ThreatEye SOC.
            </p>

            <motion.div
                initial={{
                    opacity: 0,
                    y: 30,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{
                    duration: 0.6,
                }}
                className="grid gap-8 md:grid-cols-2 xl:grid-cols-4 mt-10"
            >
                <StatCard
                    title="Total Logs"
                    value={dashboard.total_logs}
                    subtitle="All uploaded security logs"
                    icon={<Database size={28} />}
                    color="#00ff88"
                />

                <StatCard
                    title="Alerts"
                    value={dashboard.total_alerts}
                    subtitle="Detected threats"
                    icon={<ShieldAlert size={28} />}
                    color="#ff4d4f"
                />

                <StatCard
                    title="Failed Logins"
                    value={dashboard.failed_logins}
                    subtitle="Authentication failures"
                    icon={<UserX size={28} />}
                    color="#ffcc00"
                />

                <StatCard
                    title="Unique IPs"
                    value={dashboard.unique_source_ips}
                    subtitle="Distinct source addresses"
                    icon={<Globe size={28} />}
                    color="#00d9ff"
                />
            </motion.div>
        </>
    );
}