import {
    Routes,
    Route
} from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";
import Alerts from "./pages/Alerts";
import Detections from "./pages/Detections";
import Timeline from "./pages/Timeline";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

export default function App() {
    return (
        <Routes>

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/"
                element={
                    <AppLayout>
                        <Dashboard />
                    </AppLayout>
                }
            />

            <Route
                path="/logs"
                element={
                    <AppLayout>
                        <Logs />
                    </AppLayout>
                }
            />

            <Route
                path="/alerts"
                element={
                    <AppLayout>
                        <Alerts />
                    </AppLayout>
                }
            />

            <Route
                path="/detections"
                element={
                    <AppLayout>
                        <Detections />
                    </AppLayout>
                }
            />

            <Route
                path="/timeline"
                element={
                    <AppLayout>
                        <Timeline />
                    </AppLayout>
                }
            />

            <Route
                path="/reports"
                element={
                    <AppLayout>
                        <Reports />
                    </AppLayout>
                }
            />

            <Route
                path="/settings"
                element={
                    <AppLayout>
                        <Settings />
                    </AppLayout>
                }
            />

        </Routes>
    );
}