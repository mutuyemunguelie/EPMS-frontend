import apiClient from "./apiClient";

export const loginUser  = (data) => apiClient.post("/auth/login",  data);
export const logoutUser = ()     => apiClient.post("/auth/logout");
export const registerUser = (data) => apiClient.post("/auth/register", data);
export const getMe      = ()     => apiClient.get("/auth/me");
export const changePassword = (data) => apiClient.put("/auth/change-password", data);

/* Admin panel — system users only */
export const getAllUsers = (role) =>
  apiClient.get("/auth/users", { params: role ? { role } : {} });

/* Messages page — everyone including employees */
export const getAllMessageableUsers = () =>
  apiClient.get("/auth/messageable");

export const toggleUserStatus = (id) =>
  apiClient.put(`/auth/users/${id}/toggle`);

export const deleteUser = (id) =>
  apiClient.delete(`/auth/users/${id}`);

export const updateUserPermissions = (id, perms) =>
  apiClient.put(`/auth/users/${id}/permissions`, { permissions: perms });