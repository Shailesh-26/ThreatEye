import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Centered glass dialog. Closes on Escape (unless `dismissable` is false)
 * and moves keyboard focus into the dialog when it opens.
 */
export default function Modal({ open, onClose, title, children, footer, dismissable = true }) {
    const panelRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        panelRef.current?.focus();
        const onKey = (e) => {
            if (e.key === "Escape" && dismissable) onClose?.();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, dismissable, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-scope/70 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && dismissable) onClose?.();
                    }}
                >
                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        tabIndex={-1}
                        className="glass w-full max-w-md rounded-[var(--radius-sheet)] p-6 outline-none"
                        initial={{ y: 16, scale: 0.97 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: 8, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    >
                        <h2 className="font-display text-2xl font-semibold text-readout">{title}</h2>
                        <div className="mt-3 text-muted">{children}</div>
                        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
