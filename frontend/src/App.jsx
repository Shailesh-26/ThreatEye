import {
    Routes,
    Route,
    Navigate
} from "react-router-dom";
import { motion } from "framer-motion";
import {
    Clock3,
    ShieldAlert
} from "lucide-react";
import Modal from "./components/common/Modal";
import useSessionManager from "./hooks/useSessionManager";
import { isAuthenticated } from "./services/authService";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";
import Alerts from "./pages/Alerts";
import Detections from "./pages/Detections";
import Timeline from "./pages/Timeline";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function PrivateRoute({ children }) {
    return isAuthenticated()
        ? children
        : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
    return isAuthenticated()
        ? <Navigate to="/" replace />
        : children;
}

export default function App() {
    const {
        showWarning,
        sessionExpired,
        remainingTime,
        extendSession,
        logout
    } = useSessionManager();

    const minutes = Math.floor(
        remainingTime / 60000
    );

    const seconds = Math.floor(
        (remainingTime % 60000) / 1000
    );

    return (
        <>
            <Routes>
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <AppLayout>
                                <Dashboard />
                            </AppLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/logs"
                    element={
                        <PrivateRoute>
                            <AppLayout>
                                <Logs />
                            </AppLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/alerts"
                    element={
                        <PrivateRoute>
                            <AppLayout>
                                <Alerts />
                            </AppLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/detections"
                    element={
                        <PrivateRoute>
                            <AppLayout>
                                <Detections />
                            </AppLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/timeline"
                    element={
                        <PrivateRoute>
                            <AppLayout>
                                <Timeline />
                            </AppLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/reports"
                    element={
                        <PrivateRoute>
                            <AppLayout>
                                <Reports />
                            </AppLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <PrivateRoute>
                            <AppLayout>
                                <Settings />
                            </AppLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="*"
                    element={
                        <Navigate
                            to={
                                isAuthenticated()
                                    ? "/"
                                    : "/login"
                            }
                            replace
                        />
                    }
                />
            </Routes>

            <Modal
                open={showWarning}
                title="Session Expiring"
                closeOnBackdrop={false}
                onClose={() => {}}
                footer={
                    <div className="w-full">
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={logout}
                                className="group rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2.5 font-medium text-red-300 transition-all duration-300 hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.18)]"
                            >
                                Logout
                            </button>

                            <button
                                onClick={extendSession}
                                className="group rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-6 py-2.5 font-semibold text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(34,211,238,0.35)] active:scale-95"
                            >
                                Extend Session
                            </button>
                        </div>

                        <div className="mt-3 text-center text-[11px] tracking-wide text-slate-500">
                            Encrypted Session • ThreatEye Enterprise
                        </div>
                    </div>
                }
            >
                <div className="flex flex-col items-center">
                    <motion.div
                        className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-500/10"
                        animate={{
                            scale: [1, 1.06, 1],
                            boxShadow: [
                                "0 0 20px rgba(34,211,238,.15)",
                                "0 0 40px rgba(34,211,238,.35)",
                                "0 0 20px rgba(34,211,238,.15)"
                            ]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity
                        }}
                    >
                        <Clock3
                            size={30}
                            className="text-cyan-300"
                        />
                    </motion.div>

                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
                        Secure Session
                    </span>

                    <h2 className="mt-4 text-2xl font-bold text-white">
                        Session Expiring
                    </h2>

                    <p className="mt-2 max-w-sm text-center leading-7 text-slate-400">
                        Your authenticated enterprise session will expire soon due to inactivity.
                        Extend your session to continue investigating threats without interruption.
                    </p>

                    <div className="mt-5 w-full rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-5">
                        <div className="text-center text-xs uppercase tracking-[0.25em] text-slate-500">
                            Remaining Time
                        </div>

                        <div className="mt-3 flex justify-center font-mono text-6xl font-bold tracking-[0.15em] text-cyan-300">
                            <div className="flex items-center justify-center gap-2">
                                <span>
                                    {String(minutes).padStart(2, "0")}
                                </span>

                                <span className="animate-pulse text-cyan-500">
                                    :
                                </span>

                                <span>
                                    {String(seconds).padStart(2, "0")}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                                animate={{
                                    width: `${Math.min(
                                        (remainingTime / (2 * 60 * 1000)) * 100,
                                        100
                                    )}%`
                                }}
                                transition={{
                                    duration: 0.8,
                                    ease: "easeOut"
                                }}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
                        <Modal
                open={sessionExpired}
                title="Session Expired"
                closeOnBackdrop={false}
                showCloseButton={false}
                onClose={() => {}}
                footer={
                    <button
                        onClick={() => window.location.reload()}
                        className="rounded-lg bg-cyan-600 px-6 py-2 font-medium text-white transition hover:bg-cyan-500"
                    >
                        Login Again
                    </button>
                }
            >
                <div className="flex flex-col items-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 shadow-[0_0_50px_rgba(239,68,68,0.18)]">
                        <ShieldAlert
                            size={34}
                            className="text-red-400"
                        />
                    </div>

                    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-red-300">
                        Security Timeout
                    </span>

                    <h2 className="mt-4 text-2xl font-bold text-white">
                        Session Ended
                    </h2>

                    <p className="mt-4 max-w-sm text-center leading-7 text-slate-400">
                        Your authentication session has expired.
                        Please sign in again to continue accessing ThreatEye Enterprise.
                    </p>
                </div>
            </Modal>
        </>
    );
}