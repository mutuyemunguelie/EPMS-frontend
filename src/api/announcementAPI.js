import apiClient from "./apiClient";

export const getAnnouncements = (target) =>
  apiClient.get("/announcements", { params: target ? { target } : {} });

export const createAnnouncement = (data) =>
  apiClient.post("/announcements", data);

export const deleteAnnouncement = (id) =>
  apiClient.delete(`/announcements/${id}`);