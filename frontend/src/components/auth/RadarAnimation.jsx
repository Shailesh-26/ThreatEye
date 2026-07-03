import { motion } from "framer-motion";

const rings = [1, 2, 3, 4];

export default function RadarAnimation() {
  return (
    <div className="relative flex items-center justify-center w-[420px] h-[420px]">

      {/* Background Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-green-500/10 blur-3xl" />

      {/* Radar Base */}
      <div className="relative w-80 h-80 rounded-full border border-green-500/30 overflow-hidden">

        {/* Concentric Rings */}
        {rings.map((ring) => (
          <div
            key={ring}
            className="absolute rounded-full border border-green-500/20"
            style={{
              width: `${ring * 25}%`,
              height: `${ring * 25}%`,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)"
            }}
          />
        ))}

        {/* Cross Lines */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-green-500/20 -translate-x-1/2" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-green-500/20 -translate-y-1/2" />

        {/* Diagonal Lines */}
        <div className="absolute inset-0 rotate-45">
          <div className="absolute left-1/2 top-0 h-full w-px bg-green-500/10 -translate-x-1/2" />
        </div>

        <div className="absolute inset-0 -rotate-45">
          <div className="absolute left-1/2 top-0 h-full w-px bg-green-500/10 -translate-x-1/2" />
        </div>

        {/* Radar Sweep */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-0 origin-center"
        >
          <div
            className="absolute left-1/2 top-1/2 h-1/2 w-1/2 origin-bottom-left"
            style={{
              background:
                "linear-gradient(45deg, rgba(34,197,94,.45), rgba(34,197,94,0))",
              clipPath: "polygon(0 0,100% 0,0 100%)"
            }}
          />
        </motion.div>

        {/* Pulsing Center */}
        <motion.div
          animate={{
            scale: [1, 1.35, 1],
            opacity: [1, .35, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity
          }}
          className="absolute left-1/2 top-1/2 w-5 h-5 rounded-full bg-green-400 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_25px_rgba(34,197,94,.8)]"
        />

        {/* Blips */}
        <motion.div
          animate={{
            opacity: [0, 1, 0],
            scale: [0.4, 1.2, 0.4]
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity
          }}
          className="absolute top-[26%] left-[68%] w-2 h-2 rounded-full bg-green-400"
        />

        <motion.div
          animate={{
            opacity: [0, 1, 0],
            scale: [0.4, 1.2, 0.4]
          }}
          transition={{
            duration: 3.6,
            delay: 1,
            repeat: Infinity
          }}
          className="absolute top-[62%] left-[32%] w-2 h-2 rounded-full bg-green-400"
        />

        <motion.div
          animate={{
            opacity: [0, 1, 0],
            scale: [0.4, 1.2, 0.4]
          }}
          transition={{
            duration: 4,
            delay: .6,
            repeat: Infinity
          }}
          className="absolute top-[44%] left-[74%] w-2 h-2 rounded-full bg-green-400"
        />
      </div>
    </div>
  );
}