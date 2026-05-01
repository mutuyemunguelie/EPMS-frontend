import apiClient from "./apiClient";

export const getPermissionRequests = (status) =>
  apiClient.get("/permissions", { params: status ? { status } : {} });

export const createPermissionRequest = (data) =>
  apiClient.post("/permissions", data);

export const reviewPermissionRequest = (id, data) =>
  apiClient.put(`/permissions/${id}/review`, data);

export const deletePermissionRequest = (id) =>
  apiClient.delete(`/permissions/${id}`);