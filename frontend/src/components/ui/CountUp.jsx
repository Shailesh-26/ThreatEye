import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Counts from the previous value to `value` over ~0.9 s (instant with reduced motion). */
export default function CountUp({ value = 0, className = "" }) {
    const reduceMotion = useReducedMotion();
    const [shown, setShown] = useState(reduceMotion ? value : 0);
    const from = useRef(0);

    useEffect(() => {
        if (reduceMotion) {
            from.current = value;
            return undefined;
        }
        const start = performance.now();
        const begin = from.current;
        let frame;
        const step = (now) => {
            const t = Math.min(1, (now - start) / 900);
            const eased = 1 - (1 - t) ** 3;
            setShown(Math.round(begin + (value - begin) * eased));
            if (t < 1) frame = requestAnimationFrame(step);
            else from.current = value;
        };
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, [value, reduceMotion]);

    return <span className={`tabular-nums ${className}`}>{(reduceMotion ? value : shown).toLocaleString()}</span>;
}
