import { ShieldCheck, Radar, Activity, Cpu } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: ShieldCheck,
    title: "Real-time Threat Detection",
    desc: "Monitor security events instantly."
  },
  {
    icon: Radar,
    title: "Network Monitoring",
    desc: "Track suspicious activities live."
  },
  {
    icon: Activity,
    title: "Incident Response",
    desc: "Identify attacks before damage occurs."
  },
  {
    icon: Cpu,
    title: "AI Powered Analytics",
    desc: "Machine learning assisted detection."
  }
];

export default function LoginHero() {
  return (
    <div className="relative flex flex-col justify-center h-full overflow-hidden">

      {/* Background Glow */}

      <div className="absolute inset-0">

        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-green-500/20 blur-[120px]" />

        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-[150px]" />

      </div>

      {/* Grid */}

      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
          linear-gradient(rgba(34,197,94,.35) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34,197,94,.35) 1px, transparent 1px)
          `,
          backgroundSize: "45px 45px"
        }}
      />

      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: .8 }}
        className="relative z-10"
      >

        <div className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-green-400 text-sm mb-8">

          ● ThreatEye SOC Platform

        </div>

        <h1 className="text-7xl font-black leading-tight">
          Monitor.
          <br />
          Detect.
          <br />
          <span className="text-green-400">
            Respond.
          </span>
        </h1>

        <p className="mt-8 text-xl text-zinc-400 max-w-xl leading-9">
          Enterprise-grade Cyber Threat Hunting Platform built for real-time
          monitoring, intelligent detections and rapid incident response.
        </p>

        <div className="grid grid-cols-2 gap-6 mt-16">

          {features.map((item) => {

            const Icon = item.icon;

            return (

              <motion.div
                whileHover={{ scale: 1.03 }}
                key={item.title}
                className="rounded-2xl border border-green-500/10 bg-white/[0.03] p-6 backdrop-blur"
              >

                <Icon
                  size={28}
                  className="text-green-400"
                />

                <h3 className="mt-5 text-lg font-semibold">
                  {item.title}
                </h3>

                <p className="mt-2 text-zinc-500">
                  {item.desc}
                </p>

              </motion.div>

            );

          })}

        </div>

      </motion.div>

    </div>
  );
}