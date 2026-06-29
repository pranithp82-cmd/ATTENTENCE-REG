import React, { createContext, useState, useEffect, useContext } from "react";
import { api } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check token on app mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem("era_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me");
        if (res.success) {
          setUser(res.user);
        } else {
          localStorage.removeItem("era_token");
        }
      } catch (err) {
        console.error("Auth check failed:", err.message);
        localStorage.removeItem("era_token");
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (role, credentials) => {
    setLoading(true);
    try {
      const endpoint = role === "admin" ? "/auth/admin/login" : "/auth/student/login";
      const res = await api.post(endpoint, credentials);
      
      if (res.success) {
        localStorage.setItem("era_token", res.token);
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("era_token");
    setUser(null);
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const res = await api.put("/auth/change-password", { currentPassword, newPassword });
      if (res.success && user.role === "student") {
        // Update user state so the firstLogin / passwordChangeRequired banner disappears
        setUser((prev) => ({ ...prev, isPasswordResetRequired: false }));
      }
      return res;
    } catch (err) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updatePassword, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
