import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import Button from "./components/ui/Button";
import Modal from "./components/ui/Modal";
import useSessionManager from "./hooks/useSessionManager";
import Alerts from "./pages/Alerts";
import Dashboard from "./pages/Dashboard";
import Detections from "./pages/Detections";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Logs from "./pages/Logs";
import Signup from "./pages/Signup";
import { isAuthenticated } from "./services/authService";

function Private({ children }) {
    const location = useLocation();
    return isAuthenticated()
        ? children
        : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

function PublicOnly({ children }) {
    return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
    const session = useSessionManager();
    const navigate = useNavigate();

    const inApp = (page) => (
        <Private>
            <AppLayout session={session}>{page}</AppLayout>
        </Private>
    );

    const minutes = Math.floor(session.remainingTime / 60000);
    const seconds = Math.floor((session.remainingTime % 60000) / 1000);

    return (
        <>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
                <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
                <Route path="/dashboard" element={inApp(<Dashboard />)} />
                <Route path="/logs" element={inApp(<Logs />)} />
                <Route path="/alerts" element={inApp(<Alerts />)} />
                <Route path="/detections" element={inApp(<Detections />)} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <Modal
                open={session.showWarning}
                onClose={session.dismissWarning}
                title="Your session ends soon"
                footer={
                    <>
                        <Button variant="ghost" onClick={session.dismissWarning}>Not now</Button>
                        <Button variant="primary" onClick={session.extendSession}>Stay signed in</Button>
                    </>
                }
            >
                <p>
                    You'll be signed out in{" "}
                    <span className="font-display text-xl font-semibold tabular-nums text-readout">
                        {minutes}:{String(seconds).padStart(2, "0")}
                    </span>
                    . Staying signed in swaps your refresh token for a new 30-minute session.
                </p>
            </Modal>

            <Modal
                open={session.sessionExpired}
                dismissable={false}
                title="You've been signed out"
                footer={
                    <Button
                        variant="primary"
                        onClick={() => {
                            session.acknowledgeExpired();
                            navigate("/login", { replace: true });
                        }}
                    >
                        Sign in again
                    </Button>
                }
            >
                <p>Your session expired. Anything you uploaded is still saved.</p>
            </Modal>
        </>
    );
}
