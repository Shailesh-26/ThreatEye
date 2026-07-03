import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const words = [
  "Detect Threats.",
  "Analyze Logs.",
  "Monitor Networks.",
  "Respond Faster.",
  "Secure Infrastructure.",
  "Stop Attackers."
];

export default function TypingHeadline() {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex];

    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(current.substring(0, text.length + 1));

        if (text === current) {
          setTimeout(() => setDeleting(true), 1200);
        }
      } else {
        setText(current.substring(0, text.length - 1));

        if (text === "") {
          setDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, deleting ? 35 : 70);

    return () => clearTimeout(timeout);
  }, [text, deleting, wordIndex]);

  return (
    <div className="mb-8">
      <p className="text-sm uppercase tracking-[0.35em] text-green-400 font-semibold">
        ThreatEye Enterprise
      </p>

      <h1 className="mt-4 text-6xl xl:text-7xl font-black leading-tight">
        <AnimatePresence mode="wait">
          <motion.span
            key={wordIndex}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {text}
          </motion.span>
        </AnimatePresence>

        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="text-green-400"
        >
          |
        </motion.span>
      </h1>

      <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
        Enterprise-grade cyber threat hunting platform for continuous
        monitoring, intelligent detections, incident response and SOC
        visualization.
      </p>
    </div>
  );
}