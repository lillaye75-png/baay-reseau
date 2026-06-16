"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "./api";

interface User {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (phone: string, password: string) => {
    const res = await api.post("/auth/login", { phone, password });
    const { access_token, refresh_token, user: userData } = res.data;
    localStorage.setItem("token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);

    try {
      const tenantRes = await api.get("/tenants/me");
      const needsWizard = !tenantRes.data.wizard_completed && (!tenantRes.data.name || tenantRes.data.name === "My Shop");
      if (needsWizard) {
        router.push("/wizard");
      } else {
        router.push("/");
      }
    } catch {
      router.push("/");
    }
  };

  const register = async (name: string, phone: string, password: string) => {
    const res = await api.post("/auth/register", { name, phone, password });
    const { access_token, refresh_token, user: userData } = res.data;
    localStorage.setItem("token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    router.push("/wizard");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("wizard_needed");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
