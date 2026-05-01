import apiClient from "./apiClient";

export const getNotifications = () =>
  apiClient.get("/notifications");

export const markAllNotificationsRead = () =>
  apiClient.put("/notifications/read-all");

export const markNotificationRead = (id) =>
  apiClient.put(`/notifications/${id}/read`);

export const deleteNotification = (id) =>
  apiClient.delete(`/notifications/${id}`);

export const deleteAllNotifications = () =>
  apiClient.delete("/notifications/delete-all");

export const deleteSelectedNotifications = (ids) =>
  apiClient.delete("/notifications/delete-selected", { data: { ids } });

export const getNotificationReplies = (id) =>
  apiClient.get(`/notifications/${id}/replies`);

export const addNotificationReply = (id, content) =>
  apiClient.post(`/notifications/${id}/replies`, { content });

export const reactToNotificationReply = (id, replyId, emoji) =>
  apiClient.put(`/notifications/${id}/replies/${replyId}/react`, { emoji });