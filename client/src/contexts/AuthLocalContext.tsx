import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "@/lib/api";

interface AuthLocalContextType {
  autenticado: boolean;
  token: string | null;
  carregando: boolean;
  user: { id: string; email: string; role: string } | null;
  login: (email: string, password: string) => Promise<{ sucesso: boolean; erro?: string }>;
  logout: () => void;
}

const AuthLocalContext = createContext<AuthLocalContextType | null>(null);

const TOKEN_KEY = "holy_token";

export function AuthLocalProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [carregando, setCarregando] = useState(true);
  const [user, setUser] = useState<AuthLocalContextType["user"]>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) {
        setCarregando(false);
        setUser(null);
        return;
      }
      try {
        const res = await apiFetch<{ user: AuthLocalContextType["user"] }>("/api/auth/me", { token });
        if (alive) setUser(res.user);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        if (alive) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (alive) setCarregando(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiFetch<{ token: string; user: AuthLocalContextType["user"] }>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
      return { sucesso: true as const };
    } catch (e: any) {
      return { sucesso: false as const, erro: e?.message || "Falha no login" };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ autenticado: !!token, token, carregando, user, login, logout }),
    [token, carregando, user]
  );

  return <AuthLocalContext.Provider value={value}>{children}</AuthLocalContext.Provider>;
}

export function useAuthLocal() {
  const ctx = useContext(AuthLocalContext);
  if (!ctx) throw new Error("useAuthLocal must be used within AuthLocalProvider");
  return ctx;
}
