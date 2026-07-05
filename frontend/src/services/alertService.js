import api from "./api";

export const fetchAlerts=async()=>{
const res=await api.get("/alerts");
return res.data;
};