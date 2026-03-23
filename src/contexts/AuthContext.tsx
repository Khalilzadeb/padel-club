"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  playerId?: string;
  avatarUrl?: string | null;
  role?: string;
  onboardingDone?: boolean;
  eloRating?: number | null;
  matchesPlayed?: number | null;
  matchesWon?: number | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, name: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
}

const CACHE_KEY = "padel_user_cache";

function readCache(): AuthUser | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeCache(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(CACHE_KEY, JSON.stringify(user));
    else localStorage.removeItem(CACHE_KEY);
  } catch {}
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start with cached user → no loading flash on repeat visits
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    return readCache();
  });
  // loading=false if we have a cache hit, so UI shows immediately
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return readCache() === null;
  });

  const setAndCache = useCallback((u: AuthUser | null) => {
    setUser(u);
    writeCache(u);
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setAndCache(data.user);
      } else {
        setAndCache(null);
      }
    } catch {
      // network error — keep cached user, don't blank the screen
    } finally {
      setLoading(false);
    }
  }, [setAndCache]);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? "Login failed" };
      setAndCache(data.user);
      return {};
    } catch {
      return { error: "Something went wrong. Please try again." };
    }
  };

  const signup = async (email: string, name: string, password: string) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? "Signup failed" };
      setAndCache({ ...data.user, playerId: data.user.playerId });
      return {};
    } catch {
      return { error: "Something went wrong. Please try again." };
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAndCache(null);
  };

  const updateUser = (patch: Partial<AuthUser>) => {
    setUser((prev) => {
      const next = prev ? { ...prev, ...patch } : prev;
      writeCache(next);
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
