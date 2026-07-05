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
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    initial={{
                        opacity: 0
                    }}
                    animate={{
                        opacity: 1
                    }}
                    exit={{
                        opacity: 0
                    }}
                    onClick={() => {

                        if (closeOnBackdrop) {
                            onClose?.();
                        }

                    }}
                >
                    <motion.div
                        className={`relative w-full ${width} overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#0B1220] shadow-[0_0_60px_rgba(6,182,212,0.12)]`}
                        initial={{
                            opacity: 0,
                            scale: 0.95,
                            y: 20
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.95,
                            y: 20
                        }}
                        transition={{
                            duration: 0.25
                        }}
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
                        <div className="relative flex items-center justify-between border-b border-white/10 px-6 py-5">
                            <h2 className="text-xl font-semibold tracking-wide text-white">
                                {title}
                            </h2>
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                   className="rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                        <div className="relative px-6 py-6">
                            {children}
                        </div>
                        {footer && (
                            <div className="relative flex items-center justify-end gap-3 border-t border-white/10 px-6 py-5">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}