import api from "./api";

import {
    clearSession,
    setAccessToken,
    setRefreshToken,
    setSessionExpiry
} from "./sessionService";

export async function login(
    email,
    password
) {
    const response = await api.post(
        "/auth/login",
        {
            email,
            password
        }
    );

    const {
        access_token,
        refresh_token,
        expires_in
    } = response.data;

    setAccessToken(
        access_token
    );

    setRefreshToken(
        refresh_token
    );

    setSessionExpiry(
        expires_in
    );

    return response.data;
}

export async function logout() {
    try {
        const refreshToken =
            localStorage.getItem(
                "refreshToken"
            );

        if (refreshToken) {
            await api.post(
                "/auth/logout",
                {
                    refresh_token:
                        refreshToken
                }
            );
        }
    } catch (error) {
        console.error(
            "Logout failed:",
            error
        );
    } finally {
        clearSession();
    }
}

export function isAuthenticated() {
    return !!localStorage.getItem(
        "token"
    );
}