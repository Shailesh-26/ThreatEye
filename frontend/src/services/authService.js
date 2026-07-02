import api from "./api";

export async function login(email, password) {

    const response = await api.post("/auth/login", {
        email,
        password
    });

    localStorage.setItem("token", response.data.access_token);

    return response.data;

}

export function logout() {

    localStorage.removeItem("token");

}

export function isAuthenticated() {

    return !!localStorage.getItem("token");

}