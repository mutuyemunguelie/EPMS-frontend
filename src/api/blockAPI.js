import apiClient from "./apiClient";

export const getBlockedUsers = (params) =>
  apiClient.get("/blocks", { params });

export const blockUser = (target) =>
  apiClient.post("/blocks/block", { target });

export const unblockUser = (target) =>
  apiClient.post("/blocks/unblock", { target });