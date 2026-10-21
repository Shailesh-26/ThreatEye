import { useCallback, useEffect, useState } from "react";

import api from "../services/api";
import {
    clearSession,
    getAccessToken,
    getRefreshToken,
    getRemainingSessionTime,
    setAccessToken,
    setRefreshToken,
    setSessionExpiry,
} from "../services/sessionService";

const WARNING_THRESHOLD = 2 * 60 * 1000;

/**
 * Watches the access token's expiry time.
 * - 2 minutes before it expires: showWarning becomes true.
 * - When it expires: the session is cleared and sessionExpired becomes true.
 * - extendSession() swaps the refresh token for a new access token.
 */
export default function useSessionManager() {
    const [remainingTime, setRemainingTime] = useState(getRemainingSessionTime);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [dismissedWarning, setDismissedWarning] = useState(false);
    const [active, setActive] = useState(() => !!getAccessToken());

    useEffect(() => {
        const onUpdate = () => {
            setActive(!!getAccessToken());
            setRemainingTime(getRemainingSessionTime());
            setDismissedWarning(false);
            setSessionExpired(false);
        };
        window.addEventListener("session-updated", onUpdate);
        return () => window.removeEventListener("session-updated", onUpdate);
    }, []);

    useEffect(() => {
        if (!active) return undefined;
        const interval = setInterval(() => {
            const remaining = getRemainingSessionTime();
            setRemainingTime(remaining);
            if (remaining <= 0) {
                clearSession();
                setActive(false);
                setSessionExpired(true);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [active]);

    const extendSession = useCallback(async () => {
        try {
            const { data } = await api.post("/auth/refresh", {
                refresh_token: getRefreshToken(),
            });
            setAccessToken(data.access_token);
            setRefreshToken(data.refresh_token);
            setSessionExpiry(data.expires_in);
            window.dispatchEvent(new Event("session-updated"));
            return true;
        } catch {
            clearSession();
            setActive(false);
            setSessionExpired(true);
            return false;
        }
    }, []);

    return {
        remainingTime,
        showWarning: active && !dismissedWarning && remainingTime > 0 && remainingTime <= WARNING_THRESHOLD,
        sessionExpired,
        extendSession,
        dismissWarning: () => setDismissedWarning(true),
        acknowledgeExpired: () => setSessionExpired(false),
    };
}
