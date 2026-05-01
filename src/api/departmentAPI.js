import apiClient from "./apiClient";

export const getAllDepartments   = ()         => apiClient.get("/departments");
export const getDepartmentById   = (id)       => apiClient.get(`/departments/${id}`);
export const createDepartment    = (data)     => apiClient.post("/departments", data);
export const updateDepartment    = (id, data) => apiClient.put(`/departments/${id}`, data);
export const deleteDepartment    = (id)       => apiClient.delete(`/departments/${id}`);