import api from "./api";
import { announceLogsUpdated } from "../lib/events";

export async function uploadLogs(file, onProgress) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/logs/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => e.total && onProgress?.(e.loaded / e.total),
    });
    announceLogsUpdated();
    return data;
}

export async function fetchLogs() {
    const { data } = await api.get("/logs/");
    return data;
}

export async function listSamples() {
    const { data } = await api.get("/logs/samples");
    return data;
}

export async function loadSample(name) {
    const { data } = await api.post(`/logs/samples/${encodeURIComponent(name)}`);
    announceLogsUpdated();
    return data;
}
