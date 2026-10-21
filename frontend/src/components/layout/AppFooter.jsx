import { useEffect, useState } from "react";

import api from "../../services/api";
import { API_DOCS_URL } from "./navigation";

const GITHUB_URL = "https://github.com/Shailesh-26/ThreatEye";

/** Bottom bar of the app with a live check of the API and database. */
export default function AppFooter() {
    const [health, setHealth] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const check = () =>
            api.get("/health")
                .then(({ data }) => !cancelled && setHealth({ api: true, db: data.database === "connected", at: new Date() }))
                .catch(() => !cancelled && setHealth({ api: false, db: false, at: new Date() }));
        check();
        const timer = setInterval(check, 30000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    const dot = (ok) => <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-phosphor" : "bg-sev-critical"}`} />;

    return (
        <footer className="border-t border-graticule px-4 py-4 text-sm text-faint sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {health ? (
                    <span className="flex items-center gap-4" title={`Checked at ${health.at.toLocaleTimeString("en-GB")}. Rechecks every 30 seconds.`}>
                        <span className="flex items-center gap-2">{dot(health.api)} API {health.api ? "connected" : "unreachable"}</span>
                        <span className="flex items-center gap-2">{dot(health.db)} Database {health.db ? "connected" : "unreachable"}</span>
                    </span>
                ) : (
                    <span>Checking the server</span>
                )}
                <span>Rule-based detection on uploaded logs</span>
                <span className="flex gap-5 sm:ml-auto">
                    <a href={API_DOCS_URL} target="_blank" rel="noreferrer" className="hover:text-readout">API docs</a>
                    <a href={`${GITHUB_URL}/blob/main/docs/HOW_IT_WORKS.md`} target="_blank" rel="noreferrer" className="hover:text-readout">How it works</a>
                    <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-readout">Source code</a>
                </span>
            </div>
        </footer>
    );
}
