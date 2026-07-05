import {
    Routes,
    Route,
    Navigate
} from "react-router-dom";
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
                    <>
                        <button
                            onClick={logout}
                            className="rounded-lg border border-red-500/40 bg-red-500/10 px-5 py-2 text-red-400 transition hover:bg-red-500/20"
                        >
                            Logout
                        </button>
                        <button
                            onClick={extendSession}
                            className="rounded-lg bg-cyan-600 px-5 py-2 font-medium text-white transition hover:bg-cyan-500"
                        >
                            Extend Session
                        </button>
                    </>
                }
            >
                <div className="flex flex-col items-center gap-5 py-2">
                    <Clock3
                        size={48}
                        className="text-cyan-400"
                    />
                    <p className="text-center text-slate-300">
                        Your secure session will expire soon.
                    </p>
                    <div className="rounded-xl border border-cyan-500/20 bg-slate-900 px-6 py-4 text-3xl font-bold tracking-widest text-cyan-300">
                        {String(minutes).padStart(2, "0")}
                        :
                        {String(seconds).padStart(2, "0")}
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
                <div className="flex flex-col items-center gap-5 py-2">
                    <ShieldAlert
                        size={48}
                        className="text-red-400"
                    />
                    <p className="text-center text-slate-300">
                        For security reasons your session has ended.
                    </p>
                </div>
            </Modal>
        </>
    );
}