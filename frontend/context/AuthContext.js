"use client";

import { createContext, startTransition, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function getStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }

  const payload = decodeToken(token);
  if (!payload) {
    localStorage.clear();
    return null;
  }

  if (payload?.exp && payload.exp * 1000 < Date.now()) {
    localStorage.clear();
    return null;
  }

  const storedId =
    localStorage.getItem("user_id") ??
    payload.user_id ??
    payload.id ??
    payload.sub;

  return {
    id: storedId ? String(storedId) : null,
    email: localStorage.getItem("user_email") ?? payload.email ?? null,
    name: localStorage.getItem("user_name") ?? payload.name ?? null,
    username: localStorage.getItem("user_username") ?? null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    startTransition(() => {
      setUser(storedUser);
      setLoading(false);
    });
  }, []);

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

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

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
