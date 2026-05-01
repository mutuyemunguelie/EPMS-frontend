import apiClient from "./apiClient";

export const getActivityLogs = (params) =>
  apiClient.get("/activity", { params });