import apiClient from "./apiClient";

export const getAllEmployees = ()         => apiClient.get("/employees");
export const createEmployee = (data)     => apiClient.post("/employees", data);
export const updateEmployee = (id, data) => apiClient.put(`/employees/${id}`, data);
export const deleteEmployee = (id)       => apiClient.delete(`/employees/${id}`);