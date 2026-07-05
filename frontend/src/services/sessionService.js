const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const SESSION_EXPIRY_KEY = "sessionExpiry";

export function getAccessToken() {
    return localStorage.getItem(
        ACCESS_TOKEN_KEY
    );
}

export function setAccessToken(
    token
) {
    localStorage.setItem(
        ACCESS_TOKEN_KEY,
        token
    );
}

export function removeAccessToken() {
    localStorage.removeItem(
        ACCESS_TOKEN_KEY
    );
}

export function getRefreshToken() {
    return localStorage.getItem(
        REFRESH_TOKEN_KEY
    );
}

export function setRefreshToken(
    token
) {
    localStorage.setItem(
        REFRESH_TOKEN_KEY,
        token
    );
}

export function removeRefreshToken() {
    localStorage.removeItem(
        REFRESH_TOKEN_KEY
    );
}

export function setSessionExpiry(
    expiresIn
) {
    const expiry =
        Date.now() + expiresIn * 1000;

    localStorage.setItem(
        SESSION_EXPIRY_KEY,
        expiry.toString()
    );
}

export function getSessionExpiry() {
    const expiry =
        localStorage.getItem(
            SESSION_EXPIRY_KEY
        );

    return expiry
        ? Number(expiry)
        : null;
}

export function clearSession() {
    removeAccessToken();

    removeRefreshToken();

    localStorage.removeItem(
        SESSION_EXPIRY_KEY
    );
}

export function getRemainingSessionTime() {
    const expiry =
        getSessionExpiry();

    if (!expiry) {
        return 0;
    }

    return Math.max(
        expiry - Date.now(),
        0
    );
}

export function isSessionExpired() {
    return (
        getRemainingSessionTime() <= 0
    );
}