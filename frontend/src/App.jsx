import {
    Routes,
    Route,
    Navigate
} from "react-router-dom";

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

    if (!isAuthenticated()) {

        return <Navigate to="/login" replace />;

    }

    return children;

}

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
                    <PrivateRoute>
                        <AppLayout>
                            <Dashboard/>
                        </AppLayout>
                    </PrivateRoute>
                }
            />

            <Route
                path="/logs"
                element={
                    <PrivateRoute>
                        <AppLayout><Logs/></AppLayout>
                    </PrivateRoute>
                }
            />

            <Route
                path="/alerts"
                element={
                    <PrivateRoute>
                        <AppLayout><Alerts/></AppLayout>
                    </PrivateRoute>
                }
            />

            <Route
                path="/detections"
                element={
                    <PrivateRoute>
                        <AppLayout><Detections/></AppLayout>
                    </PrivateRoute>
                }
            />

            <Route
                path="/timeline"
                element={
                    <PrivateRoute>
                        <AppLayout><Timeline/></AppLayout>
                    </PrivateRoute>
                }
            />

            <Route
                path="/reports"
                element={
                    <PrivateRoute>
                        <AppLayout><Reports/></AppLayout>
                    </PrivateRoute>
                }
            />

            <Route
                path="/settings"
                element={
                    <PrivateRoute>
                        <AppLayout><Settings/></AppLayout>
                    </PrivateRoute>
                }
            />

        </Routes>

    );

}