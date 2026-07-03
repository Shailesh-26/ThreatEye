import { motion } from "framer-motion";

export default function ScanLines() {
  return (
    <>
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.09]
          bg-[linear-gradient(to_bottom,transparent_50%,rgba(34,197,94,.25)_51%,transparent_52%)]
          bg-[length:100%_4px]
        "
      />

      <motion.div
        animate={{
          y: ["-100%", "100%"]
        }}
        transition={{
          duration: 5,
          ease: "linear",
          repeat: Infinity
        }}
        className="
          pointer-events-none
          absolute
          left-0
          right-0
          h-32
          bg-gradient-to-b
          from-transparent
          via-green-400/10
          to-transparent
          blur-sm
        "
      />
    </>
  );
}