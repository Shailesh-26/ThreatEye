import api from "./api";

export async function fetchAlerts() {
    const { data } = await api.get("/alerts/");
    return data;
}
