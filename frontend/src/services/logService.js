import api from "./api";

export const uploadLogs = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/logs/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return res.data;
};

export const fetchLogs = async () => {
    const res = await api.get("/logs");
    return res.data;
};