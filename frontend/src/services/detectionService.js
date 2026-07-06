import api from "./api";

export const getDetectionRules = async () => {
  const { data } = await api.get("/detections/rules");
  return data;
};