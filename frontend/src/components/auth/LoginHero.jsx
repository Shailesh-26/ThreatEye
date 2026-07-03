import { ShieldCheck, Radar, Activity, Cpu } from "lucide-react";
import { motion } from "framer-motion";

import RadarAnimation from "./RadarAnimation";
import TypingHeadline from "./TypingHeadline";
import ParticleField from "./ParticleField";
import ThreatFeed from "./ThreatFeed";

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
    <div className="relative flex h-full items-center overflow-hidden">
      <ParticleField />

      {/* Background Glow */}

      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-green-500/15 blur-[140px]" />

        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[180px]" />

      </div>

      <div className="relative z-10 grid w-full grid-cols-2 gap-14 items-center">

        {/* Left */}

        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: .8 }}
        >

          <div className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400 mb-8">

            ● ThreatEye Enterprise SOC

          </div>

          <TypingHeadline />

          <div className="grid grid-cols-2 gap-5 mt-12">

            {features.map((feature) => {

              const Icon = feature.icon;

              return (

                <motion.div
                  key={feature.title}
                  whileHover={{
                    y: -5,
                    scale: 1.02
                  }}
                  transition={{
                    duration: .2
                  }}
                  className="
                    rounded-2xl
                    border
                    border-green-500/10
                    bg-white/[0.03]
                    backdrop-blur-xl
                    p-6
                  "
                >

                  <Icon
                    size={26}
                    className="text-green-400"
                  />

                  <h3 className="mt-4 text-lg font-semibold">

                    {feature.title}

                  </h3>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">

                    {feature.desc}

                  </p>

                </motion.div>

              );

            })}

          </div>

        </motion.div>

        {/* Right */}

        <motion.div
  initial={{ opacity: 0, scale: .9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 1 }}
  className="flex flex-col items-center gap-10"
>
  <RadarAnimation />
  <ThreatFeed />
</motion.div>

      </div>

    </div>
  );
}