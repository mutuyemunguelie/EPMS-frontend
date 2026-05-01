import apiClient from "./apiClient";

export const getMyGroups = () =>
  apiClient.get("/groups");

export const getGroupMessages = (id) =>
  apiClient.get(`/groups/${id}/messages`);

export const sendGroupMessage = (id, data) =>
  apiClient.post(`/groups/${id}/messages`, data);

export const joinGroup = (id) =>
  apiClient.post(`/groups/${id}/join`);

export const reactGroupMessage = (id, messageId, emoji) =>
  apiClient.put(`/groups/${id}/messages/${messageId}/react`, { emoji });