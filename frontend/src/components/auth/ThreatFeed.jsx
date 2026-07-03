import { motion } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  Radar,
  Activity,
  Globe,
  Server
} from "lucide-react";

const threats = [
  {
    icon: ShieldAlert,
    title: "Brute Force Attempt",
    source: "192.168.1.54",
    severity: "Critical",
    color: "text-red-400",
    border: "border-red-500/20"
  },
  {
    icon: Radar,
    title: "Port Scan Detected",
    source: "10.0.0.12",
    severity: "High",
    color: "text-yellow-400",
    border: "border-yellow-500/20"
  },
  {
    icon: Globe,
    title: "Suspicious Login",
    source: "Singapore",
    severity: "Medium",
    color: "text-cyan-400",
    border: "border-cyan-500/20"
  },
  {
    icon: Server,
    title: "Firewall Updated",
    source: "Edge Gateway",
    severity: "Info",
    color: "text-green-400",
    border: "border-green-500/20"
  },
  {
    icon: Activity,
    title: "Traffic Spike",
    source: "Production Cluster",
    severity: "Medium",
    color: "text-blue-400",
    border: "border-blue-500/20"
  },
  {
    icon: ShieldCheck,
    title: "Threat Blocked",
    source: "Endpoint #27",
    severity: "Resolved",
    color: "text-green-400",
    border: "border-green-500/20"
  }
];

export default function ThreatFeed() {
  const feed = [...threats, ...threats];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-green-500/10 bg-white/[0.03] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-green-500/10 px-5 py-4">
        <div>
          <h3 className="font-semibold text-white">Live Threat Feed</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Simulated real-time security events
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-green-400">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          LIVE
        </div>
      </div>

      <div className="relative h-72 overflow-hidden">
        <motion.div
          animate={{ y: ["0%", "-50%"] }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear"
          }}
          className="space-y-3 p-4"
        >
          {feed.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className={`flex items-center justify-between rounded-xl border ${item.border} bg-[#0b0f14]/80 px-4 py-3 transition hover:border-green-500/30`}
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-black/30 p-2">
                    <Icon size={18} className={item.color} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">
                      {item.title}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {item.source}
                    </p>
                  </div>
                </div>

                <span className={`text-xs font-semibold ${item.color}`}>
                  {item.severity}
                </span>
              </div>
            );
          })}
        </motion.div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#050608] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#050608] to-transparent" />
      </div>
    </div>
  );
}