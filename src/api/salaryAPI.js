import apiClient from "./apiClient";

export const getAllSalaries = ()         => apiClient.get("/salaries");
export const createSalary  = (data)     => apiClient.post("/salaries", data);
export const updateSalary  = (id, data) => apiClient.put(`/salaries/${id}`, data);
export const deleteSalary  = (id)       => apiClient.delete(`/salaries/${id}`);
export const getPayrollReport = (month) =>
  apiClient.get("/salaries/report", { params: { month } });