import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function MouseParallax({ children }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => {
      const x = ((e.clientX / window.innerWidth) - 0.5) * 8;
      const y = ((e.clientY / window.innerHeight) - 0.5) * 8;

      setPosition({ x, y });
    };

    window.addEventListener("mousemove", handleMove);

    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <motion.div
      animate={{
        x: position.x,
        y: position.y
      }}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 30
      }}
    >
      {children}
    </motion.div>
  );
}