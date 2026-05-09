"use client";

import { useState, useEffect, useCallback } from "react";
import type { IUser } from "@/types";

const TOKEN_KEY = "callm_token";

export function useAuth() {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      fetchMe(stored);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchMe(t: string) {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const json = await res.json();
      if (json.success) {
        setUser(json.data);
      } else {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!json.success) {
      const detail = json.details
        ? Object.values(json.details as Record<string, string[]>).flat().join(" · ")
        : null;
      throw new Error(detail || json.error);
    }
    localStorage.setItem(TOKEN_KEY, json.data.token);
    setToken(json.data.token);
    setUser(json.data.user);
    return json.data;
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await res.json();
      if (!json.success) {
        const detail = json.details
          ? Object.values(json.details as Record<string, string[]>).flat().join(" · ")
          : null;
        throw new Error(detail || json.error);
      }
      localStorage.setItem(TOKEN_KEY, json.data.token);
      setToken(json.data.token);
      setUser(json.data.user);
      return json.data;
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return { user, token, loading, login, register, logout };
}
