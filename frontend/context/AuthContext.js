"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      const payload = decodeToken(token);

      // 🔥 NEW: expiry check
      if (payload?.exp && payload.exp * 1000 < Date.now()) {
        logout();
      } else if (payload) {
        const storedId = localStorage.getItem("user_id");
        const resolvedId =
          storedId ??
          payload.user_id ??
          payload.id ??
          payload.sub;

        setUser({
          id: resolvedId ? String(resolvedId) : null,
          email: localStorage.getItem("user_email") ?? payload.email ?? null,
          name: localStorage.getItem("user_name") ?? payload.name ?? null,
          username: localStorage.getItem("user_username") ?? null,
        });
      }
    }

    setLoading(false);
  }, []);

  const login = (token, userData = {}) => {
    localStorage.setItem("token", token);

    const payload = decodeToken(token);

    const resolvedId =
      userData.id ??
      userData.user_id ??
      payload?.user_id ??
      payload?.id ??
      payload?.sub;

    if (resolvedId) {
      localStorage.setItem("user_id", String(resolvedId));
    }

    // 🔥 OPTIONAL: sensitive data reduce
    if (userData.email) localStorage.setItem("user_email", userData.email);
    if (userData.name) localStorage.setItem("user_name", userData.name);
    if (userData.username)
      localStorage.setItem("user_username", userData.username);

    setUser({
      id: resolvedId ? String(resolvedId) : null,
      email: userData.email ?? payload?.email ?? null,
      name: userData.name ?? null,
      username: userData.username ?? null,
    });
  };

  const logout = () => {
    localStorage.clear(); // 🔥 simpler + safer
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);