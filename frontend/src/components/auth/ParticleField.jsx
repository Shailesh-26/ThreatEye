import { motion } from "framer-motion";

const particles = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  size: Math.random() * 4 + 2,
  left: Math.random() * 100,
  top: Math.random() * 100,
  duration: Math.random() * 8 + 10,
  delay: Math.random() * 5
}));

export default function ParticleField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          initial={{
            y: 0,
            opacity: 0,
            scale: 0
          }}
          animate={{
            y: [-10, -45, -10],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute rounded-full bg-green-400 shadow-[0_0_10px_rgba(34,197,94,.8)]"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.left}%`,
            top: `${particle.top}%`
          }}
        />
      ))}

      <motion.div
        animate={{
          opacity: [0.03, 0.08, 0.03]
        }}
        transition={{
          duration: 5,
          repeat: Infinity
        }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,.12),transparent_70%)]"
      />
    </div>
  );
}