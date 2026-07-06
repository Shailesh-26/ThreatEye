import { motion } from "framer-motion";
import {
    ChevronRight,
    ShieldAlert,
    Radar
} from "lucide-react";

const severityStyles = {
    Critical: {
        dot: "bg-red-500",
        icon: "text-red-400",
        ip: "text-red-400",
        border: "hover:border-red-500/40",
        arrow: "group-hover:text-red-400"
    },

    High: {
        dot: "bg-orange-500",
        icon: "text-orange-400",
        ip: "text-orange-400",
        border: "hover:border-orange-500/40",
        arrow: "group-hover:text-orange-400"
    },

    Medium: {
        dot: "bg-yellow-400",
        icon: "text-yellow-400",
        ip: "text-yellow-400",
        border: "hover:border-yellow-400/40",
        arrow: "group-hover:text-yellow-400"
    },

    Low: {
        dot: "bg-blue-400",
        icon: "text-blue-400",
        ip: "text-blue-400",
        border: "hover:border-blue-400/40",
        arrow: "group-hover:text-blue-400"
    }
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
    const style =
    severityStyles[alert.severity] ??
    severityStyles.Low;

    return (
        <motion.div
            whileHover={{
                scale: 1.01,
                x: 6
            }}
            transition={{
                duration: 0.2
            }}
className={`group flex items-center justify-between rounded-xl border border-zinc-800 bg-[#11151A] p-5 transition-all hover:bg-[#151A20] ${style.border}`}        >
            <div className="flex items-center gap-4">
                <div
                    className={`h-3 w-3 rounded-full ${style.dot}`}
                />

                <Icon
                    className={style.icon}
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
                    <div className={`text-sm ${style.ip}`}>
                        {alert.source_ip}
                    </div>

                    <div className="text-xs text-zinc-500">
                        {alert.severity}
                    </div>
                </div>

                <ChevronRight
                    className={`text-zinc-600 transition ${style.arrow}`}
                    size={20}
                />
            </div>
        </motion.div>
    );
}