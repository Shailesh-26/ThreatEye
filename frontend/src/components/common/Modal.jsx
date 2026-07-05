import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function Modal({
    open,
    title,
    children,
    footer,
    onClose,
    closeOnBackdrop = true,
    closeOnEscape = true,
    showCloseButton = true,
    width = "max-w-lg"
}) {
    useEffect(() => {
        if (!open || !closeOnEscape) {
            return;
        }

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose?.();
            }
        };

        window.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [
        open,
        closeOnEscape,
        onClose
    ]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6"
                    initial={{
                        opacity: 0
                    }}
                    animate={{
                        opacity: 1
                    }}
                    exit={{
                        opacity: 0
                    }}
                    transition={{
                        duration: 0.2
                    }}
                    onClick={() => {
                        if (closeOnBackdrop) {
                            onClose?.();
                        }
                    }}
                >
                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.92,
                            y: 25
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.96,
                            y: 20
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 280,
                            damping: 24
                        }}
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                        className={`relative w-full ${width} overflow-hidden rounded-3xl border border-cyan-400/20 bg-[#0B1220]/95 shadow-[0_25px_80px_rgba(0,0,0,0.65)]`}
                    >
                        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-cyan-400 via-sky-500 to-cyan-400" />
                        <div className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
                        <div className="relative flex items-center justify-between border-b border-white/10 px-7 py-5">
                            <h2 className="text-xl font-semibold tracking-wide text-white">
                                {title}
                            </h2>

                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="rounded-xl p-2 text-slate-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        <div className="relative px-7 py-7">
                            {children}
                        </div>

                        {footer && (
                            <div className="relative flex items-center justify-end gap-3 border-t border-white/10 bg-white/[0.02] px-7 py-5">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}