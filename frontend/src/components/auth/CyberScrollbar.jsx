import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CyberScrollbar({ containerRef }) {
    const [thumbTop, setThumbTop] = useState(0);
    const [thumbHeight, setThumbHeight] = useState(80);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        let timeout;

        const update = () => {
            const { scrollTop, scrollHeight, clientHeight } = el;

            const ratio = clientHeight / scrollHeight;
            const h = Math.max(clientHeight * ratio, 90);

            const scrollable = scrollHeight - clientHeight;

const top =
    scrollable > 0
        ? (scrollTop / scrollable) * (clientHeight - h)
        : 0;

            setThumbHeight(h);
            setThumbTop(top);

            setVisible(true);

            clearTimeout(timeout);

            timeout = setTimeout(() => {
                setVisible(false);
            }, 900);
        };

        update();

        el.addEventListener("scroll", update);

        el.addEventListener("mouseenter", () => setVisible(true));

        el.addEventListener("mouseleave", () => {
            timeout = setTimeout(() => {
                setVisible(false);
            }, 500);
        });

        window.addEventListener("resize", update);

        return () => {
            el.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
            clearTimeout(timeout);
        };
    }, [containerRef]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: .25 }}
                    className="pointer-events-none absolute inset-y-0 right-2 w-3 z-50"
                >
                    <motion.div
                        animate={{
                            y: thumbTop
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 40
                        }}
                        style={{
                            height: thumbHeight
                        }}
className="absolute right-0 w-[4px] rounded-full
bg-gradient-to-b
from-green-400/20
via-green-400
to-green-400/20
shadow-[0_0_10px_rgba(34,197,94,.8),0_0_24px_rgba(34,197,94,.45)]"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}