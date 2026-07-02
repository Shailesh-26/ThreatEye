import { motion } from "framer-motion";

export default function StatCard({
    title,
    value,
    subtitle,
    icon,
    color,
}) {
    return (
        <motion.div
            whileHover={{
                y: -6,
                scale: 1.02,
            }}
            transition={{
                duration: 0.25,
            }}
            className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#101317] p-6"
        >
            <div
                className="absolute top-0 left-0 h-1 w-full"
                style={{
                    background: color,
                }}
            />

            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-zinc-400">
                        {title}
                    </p>

                    <h2
                        className="mt-4 text-5xl font-bold"
                        style={{
                            color,
                        }}
                    >
                        {value}
                    </h2>

                    <p className="mt-3 text-xs text-zinc-500">
                        {subtitle}
                    </p>
                </div>

                <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-900 text-2xl"
                    style={{
                        color,
                    }}
                >
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}