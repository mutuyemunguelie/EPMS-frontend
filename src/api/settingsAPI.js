import apiClient from "./apiClient";

/* Get all settings as a map */
export const getSettings = () =>
  apiClient.get("/settings");

/* Update a single setting — sends key+value in body */
export const updateSetting = (key, value) =>
  apiClient.put("/settings", { key, value });