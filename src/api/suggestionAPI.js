import apiClient from "./apiClient";

export const getSuggestions = () => apiClient.get("/suggestions");
export const createSuggestion = (data) => apiClient.post("/suggestions", data);
export const reviewSuggestion = (id, data) => apiClient.put(`/suggestions/${id}/review`, data);