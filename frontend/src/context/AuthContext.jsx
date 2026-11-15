import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("deskline_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("deskline_token");
    if (!token) {
      setReady(true);
      return;
    }
    client
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("deskline_user", JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem("deskline_token");
        localStorage.removeItem("deskline_user");
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const persist = (token, userData) => {
    localStorage.setItem("deskline_token", token);
    localStorage.setItem("deskline_user", JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (email, password) => {
    const res = await client.post("/auth/login", { email, password });
    persist(res.data.token, res.data.user);
    return res.data.user;
  };

  const register = async (name, email, password) => {
    const res = await client.post("/auth/register", { name, email, password });
    persist(res.data.token, res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("deskline_token");
    localStorage.removeItem("deskline_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, ready, login, register, logout, isAdmin: user?.role === "admin" }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
