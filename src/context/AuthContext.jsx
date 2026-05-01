import React, { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const s = sessionStorage.getItem("epms_user");
      return s ? JSON.parse(s) : null;
    } catch {
      sessionStorage.removeItem("epms_user");
      return null;
    }
  });

  const login = useCallback((userData) => {
    try {
      sessionStorage.setItem("epms_user", JSON.stringify(userData));
      setUser(userData);
    } catch {}
  }, []);

  const logout = useCallback(() => {
    try { sessionStorage.removeItem("epms_user"); } catch {}
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export default AuthContext;