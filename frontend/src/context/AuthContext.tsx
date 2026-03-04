"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AuthUser, fetchMe } from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  loginStore: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  loginStore: () => {},
  logout: () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // On mount, check localStorage
  useEffect(() => {
    let isSubscribed = true;
    const token = localStorage.getItem("token");

    if (token) {
      fetchMe(token)
        .then((userData: AuthUser) => {
          if (isSubscribed) setUser(userData);
        })
        .catch(() => {
          if (isSubscribed) {
            localStorage.removeItem("token");
            setUser(null);
          }
        })
        .finally(() => {
          if (isSubscribed) setLoading(false);
        });
    } else {
      // No token — nothing to validate, mark auth check as done immediately
      setLoading(false);
    }
    return () => {
      isSubscribed = false;
    };
  }, []);

  const loginStore = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(newUser);
    // Ensure loading is false after explicit login so auth guards don't block rendering
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, token, loading, loginStore, logout, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
