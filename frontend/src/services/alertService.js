import api from "./api";

export async function getAlerts() {
    const token = localStorage.getItem("token");
    const response = await api.get("/alerts", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
}