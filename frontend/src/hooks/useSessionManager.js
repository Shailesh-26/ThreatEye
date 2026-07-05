import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";
import {
    clearSession,
    getAccessToken,
    getRefreshToken,
    getRemainingSessionTime,
    setAccessToken,
    setRefreshToken,
    setSessionExpiry
} from "../services/sessionService";

const WARNING_THRESHOLD = 2 * 60 * 1000;

export default function useSessionManager() {
    const intervalRef = useRef(null);
    const [showWarning, setShowWarning] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);

    const stopTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        stopTimer();

        if (!getAccessToken()) {
            return;
        }

        intervalRef.current = setInterval(() => {
            const remaining = getRemainingSessionTime();

            setRemainingTime(remaining);

            if (
                remaining <= WARNING_THRESHOLD &&
                remaining > 0
            ) {
                setShowWarning(true);
            }

            if (remaining <= 0) {
                logout();
            }
        }, 1000);
    }, [stopTimer]);

    const logout = useCallback(() => {
        stopTimer();
        clearSession();
        setShowWarning(false);
        setSessionExpired(true);
    }, [stopTimer]);

    const extendSession = useCallback(async () => {
        try {
            const response = await api.post(
                "/auth/refresh",
                {
                    refresh_token: getRefreshToken()
                }
            );

            const {
                access_token,
                refresh_token,
                expires_in
            } = response.data;

            setAccessToken(access_token);
            setRefreshToken(refresh_token);
            setSessionExpiry(expires_in);
            setShowWarning(false);
            setSessionExpired(false);
            startTimer();
        } catch {
            logout();
        }
    }, [
        logout,
        startTimer
    ]);

    const resetSession = useCallback(() => {
        setShowWarning(false);
        setSessionExpired(false);
        startTimer();
    }, [startTimer]);

    useEffect(() => {
        if (getAccessToken()) {
            resetSession();
        }

        const handleSessionUpdate = () => {
            resetSession();
        };

        window.addEventListener(
            "session-updated",
            handleSessionUpdate
        );

        return () => {
            window.removeEventListener(
                "session-updated",
                handleSessionUpdate
            );

            stopTimer();
        };
    }, [
        resetSession,
        stopTimer
    ]);

    return {
        showWarning,
        sessionExpired,
        remainingTime,
        extendSession,
        logout,
        resetSession,
        closeWarning: () =>
            setShowWarning(false)
    };
}