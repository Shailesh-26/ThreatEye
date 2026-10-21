import api from "./api";

import {
    clearSession,
    getAccessToken,
    getRefreshToken,
    setAccessToken,
    setRefreshToken,
    setSessionExpiry,
} from "./sessionService";

function saveSession({ access_token, refresh_token, expires_in }) {
    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    setSessionExpiry(expires_in);
    window.dispatchEvent(new Event("session-updated"));
}

export async function login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    saveSession(response.data);
    return response.data;
}

/** Creates the account, then signs straight in. */
export async function register(username, email, password) {
    await api.post("/auth/register", { username, email, password });
    return login(email, password);
}

/** Revokes the refresh token on the server, then clears this browser's session. */
export async function logout() {
    const refreshToken = getRefreshToken();
    try {
        if (refreshToken) {
            await api.post("/auth/logout", { refresh_token: refreshToken });
        }
    } catch {
        // Already invalid on the server - clearing locally is enough.
    } finally {
        clearSession();
        window.dispatchEvent(new Event("session-updated"));
    }
}

export async function getCurrentUser() {
    const response = await api.get("/auth/me");
    return response.data;
}

export function isAuthenticated() {
    return !!getAccessToken();
}

/** Turns an API error into one sentence for the form. */
export function errorMessage(error, fallback) {
    const detail = error?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) {
        const field = detail[0].loc?.[detail[0].loc.length - 1];
        return field ? `${field}: ${detail[0].msg}` : detail[0].msg;
    }
    if (!error?.response) return "Can't reach the ThreatEye server. Check that the backend is running on port 8000.";
    return fallback;
}
