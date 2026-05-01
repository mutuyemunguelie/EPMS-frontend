import apiClient from "./apiClient";

export const getChatPartners = () =>
  apiClient.get("/messages/partners");

export const getConversation = (partner) =>
  apiClient.get(`/messages/${partner}`);

export const sendMessage = (data) =>
  apiClient.post("/messages", data);

export const editMessage = (id, content) =>
  apiClient.put(`/messages/${id}/edit`, { content });

export const reactToMessage = (id, type) =>
  apiClient.put(`/messages/${id}/react`, { type });

export const pinMessage = (id) =>
  apiClient.put(`/messages/${id}/pin`);

export const deleteMessage = (id) =>
  apiClient.delete(`/messages/${id}`);

export const getPinnedMessages = (partner) =>
  apiClient.get(`/messages/pinned/${partner}`);

export const markMessagesRead = (partner) =>
  apiClient.put(`/messages/read/${partner}`);