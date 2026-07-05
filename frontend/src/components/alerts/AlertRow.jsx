import { motion } from "framer-motion";
import {
    ChevronRight,
    ShieldAlert,
    Radar
} from "lucide-react";

const severityColor = {
    Critical: "bg-red-500",
    High: "bg-orange-500",
    Medium: "bg-yellow-400",
    Low: "bg-green-500"
};

const iconMap = {
    shield: ShieldAlert,
    radar: Radar
};

export default function AlertRow({
    alert
}) {
    const Icon =
        iconMap[alert.icon] ??
        ShieldAlert;

    return (
        <motion.div
            whileHover={{
                scale: 1.01,
                x: 6
            }}
            transition={{
                duration: 0.2
            }}
            className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-[#11151A] p-5 transition-all hover:border-green-500/40 hover:bg-[#151A20]"
        >
            <div className="flex items-center gap-4">
                <div
                    className={`h-3 w-3 rounded-full ${severityColor[alert.severity]}`}
                />

                <Icon
                    className="text-green-400"
                    size={22}
                />

                <div>
                    <h3 className="font-semibold text-white">
                        {alert.title}
                    </h3>

                    <p className="mt-1 text-sm text-zinc-400">
                        {alert.recommendation}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-8">
                <div className="text-right">
                    <div className="text-sm text-green-400">
                        {alert.source_ip}
                    </div>

                    <div className="text-xs text-zinc-500">
                        {alert.severity}
                    </div>
                </div>

                <ChevronRight
                    className="text-zinc-600 transition group-hover:text-green-400"
                    size={20}
                />
            </div>
        </motion.div>
    );
}