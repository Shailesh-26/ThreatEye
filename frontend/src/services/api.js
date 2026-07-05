import axios from "axios";

import {
    clearSession,
    getAccessToken,
    getRefreshToken,
    setAccessToken,
    setRefreshToken,
    setSessionExpiry
} from "./sessionService";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/v1"
});

let isRefreshing = false;

let failedQueue = [];

function processQueue(
    error,
    token = null
) {
    failedQueue.forEach(
        (promise) => {

            if (error) {
                promise.reject(error);
            } else {
                promise.resolve(token);
            }

        }
    );

    failedQueue = [];
}

api.interceptors.request.use(
    (config) => {

        const token =
            getAccessToken();

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;

    }
);

api.interceptors.response.use(

    (response) => response,

    async (error) => {

        const originalRequest =
            error.config;

        if (
            error.response?.status !== 401 ||
            originalRequest._retry
        ) {
            return Promise.reject(error);
        }

        if (isRefreshing) {

            return new Promise(
                (
                    resolve,
                    reject
                ) => {

                    failedQueue.push({
                        resolve,
                        reject
                    });

                }
            ).then(
                (token) => {

                    originalRequest.headers.Authorization =
                        `Bearer ${token}`;

                    return api(
                        originalRequest
                    );

                }
            );

        }

        originalRequest._retry = true;

        isRefreshing = true;

        try {

            const response =
                await axios.post(
                    "http://127.0.0.1:8000/api/v1/auth/refresh",
                    {
                        refresh_token:
                            getRefreshToken()
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

            processQueue(
                null,
                access_token
            );

            originalRequest.headers.Authorization =
                `Bearer ${access_token}`;

            return api(
                originalRequest
            );

        } catch (refreshError) {

            processQueue(
                refreshError,
                null
            );

            clearSession();

            window.location.replace(
                "/login"
            );

            return Promise.reject(
                refreshError
            );

        } finally {

            isRefreshing = false;

        }

    }

);

export default api;