import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, LogOut, Play, Search, Upload } from "lucide-react";
import { toast } from "sonner";

import Kbd from "../ui/Kbd";
import { logout } from "../../services/authService";
import { getDetectionRules, runDetectionRule } from "../../services/detectionService";
import { API_DOCS_URL, NAV_ITEMS } from "./navigation";

/**
 * Ctrl+K / Cmd+K: jump to a page, run a detector, or sign out - all from the keyboard.
 * Every command does something real; there are no decorative entries.
 */
export default function CommandPalette({ open, onClose }) {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const [rules, setRules] = useState([]);

    useEffect(() => {
        if (!open) return;
        getDetectionRules()
            .then((list) => setRules(list.filter((rule) => rule.enabled)))
            .catch(() => setRules([]));
    }, [open]);

    const commands = useMemo(() => {
        const go = NAV_ITEMS.map((item) => ({
            id: `go-${item.to}`,
            group: "Go to",
            label: item.label,
            hint: item.description,
            icon: item.icon,
            run: () => navigate(item.to),
        }));
        const actions = [
            { id: "upload", group: "Actions", label: "Upload a log file", hint: "Opens the Logs page", icon: Upload, run: () => navigate("/logs") },
            ...rules.map((rule) => ({
                id: `run-${rule.id}`,
                group: "Actions",
                label: `Run ${rule.name} detector`,
                hint: "On the logs loaded now",
                icon: Play,
                run: async () => {
                    try {
                        const result = await runDetectionRule(rule.id);
                        toast.success(`${rule.name} ran`, {
                            description: `${result.alerts} alert${result.alerts === 1 ? "" : "s"} on the current logs.`,
                        });
                    } catch (error) {
                        toast.error(`${rule.name} didn't run`, {
                            description: error?.response?.data?.detail ?? "The server didn't respond.",
                        });
                    }
                },
            })),
            { id: "docs", group: "Actions", label: "Open API docs", hint: "FastAPI /docs in a new tab", icon: BookOpen, run: () => window.open(API_DOCS_URL, "_blank", "noopener") },
            {
                id: "signout", group: "Account", label: "Sign out", hint: "Ends this session on the server too", icon: LogOut,
                run: async () => {
                    await logout();
                    navigate("/login", { replace: true });
                },
            },
        ];
        const q = query.trim().toLowerCase();
        const all = [...go, ...actions];
        return q ? all.filter((c) => `${c.label} ${c.hint}`.toLowerCase().includes(q)) : all;
    }, [navigate, query, rules]);

    function close() {
        setQuery("");
        setActive(0);
        onClose();
    }

    function execute(command) {
        close();
        command?.run();
    }

    function onKeyDown(e) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(commands.length - 1, i + 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(0, i - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            execute(commands[active]);
        } else if (e.key === "Escape") {
            close();
        }
    }

    let lastGroup = null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-start justify-center bg-scope/60 px-4 pt-[12vh]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onMouseDown={(e) => e.target === e.currentTarget && close()}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Command palette"
                        className="glass w-full max-w-xl overflow-hidden rounded-[var(--radius-sheet)]"
                        initial={{ y: -12, scale: 0.98 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: -8, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        onAnimationStart={() => inputRef.current?.focus()}
                    >
                        <div className="flex items-center gap-3 border-b border-graticule px-4">
                            <Search size={18} className="text-faint" />
                            <input
                                ref={inputRef}
                                autoFocus
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setActive(0);
                                }}
                                onKeyDown={onKeyDown}
                                placeholder="Type a page or an action"
                                aria-label="Search commands"
                                aria-activedescendant={commands[active] ? `cmd-${commands[active].id}` : undefined}
                                className="h-14 flex-1 bg-transparent text-readout outline-none placeholder:text-faint focus-visible:outline-none"
                            />
                            <Kbd>Esc</Kbd>
                        </div>

                        <ul role="listbox" className="scrollbar-thin max-h-[52vh] overflow-y-auto p-2">
                            {commands.length === 0 && (
                                <li className="px-3 py-6 text-center text-sm text-faint">
                                    Nothing matches "{query}". Try "alerts" or "run".
                                </li>
                            )}
                            {commands.map((command, i) => {
                                const showGroup = command.group !== lastGroup;
                                lastGroup = command.group;
                                const Icon = command.icon;
                                return (
                                    <li key={command.id}>
                                        {showGroup && (
                                            <div className="px-3 pb-1 pt-3 text-xs text-faint">{command.group}</div>
                                        )}
                                        <button
                                            id={`cmd-${command.id}`}
                                            type="button"
                                            role="option"
                                            aria-selected={i === active}
                                            onMouseEnter={() => setActive(i)}
                                            onClick={() => execute(command)}
                                            className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors ${i === active ? "bg-plate-hi text-readout" : "text-muted"}`}
                                        >
                                            <Icon size={17} className={i === active ? "text-phosphor" : "text-faint"} />
                                            <span className="flex-1">{command.label}</span>
                                            <span className="hidden text-sm text-faint sm:inline">{command.hint}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
