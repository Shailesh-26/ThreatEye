import api from "./api";

export const getDetectionRules = async () => {
  const { data } = await api.get("/detections/rules");
  return data;
};

export const runDetectionRule = async (id) => {
  const { data } = await api.post(`/detections/run/${id}`);
  return data;
};