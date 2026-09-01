"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api, ApiError } from "@/lib/api";
import type { User, AuthResponse } from "@/lib/types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    registerCardNow: boolean,
  ) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const TOKEN_KEY = "inv_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = (t: string, u: User) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
  };

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) return;
    try {
      const u = await api<User>("/api/auth/me", { token: saved });
      setUser(u);
    } catch {
      // ignore
    }
  }, []);

  // Hydrate on mount
  useEffect(() => {
    const hydrate = async () => {
      const saved = localStorage.getItem(TOKEN_KEY);
      if (!saved) {
        setLoading(false);
        return;
      }
      setToken(saved);
      try {
        const u = await api<User>("/api/auth/me", { token: saved });
        setUser(u);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    hydrate();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    persist(data.access_token, data.user);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    registerCardNow: boolean,
  ): Promise<AuthResponse> => {
    const data = await api<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: { name, email, password, register_card_now: registerCardNow },
    });
    persist(data.access_token, data.user);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
