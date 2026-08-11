"use client";

import { useState, useEffect, useCallback } from "react";
import type { IUser } from "@/types";

const TOKEN_KEY = "callm_token";

export class AuthRequestError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "AuthRequestError";
  }
}

interface ApiResult {
  success: boolean;
  error?: string;
  details?: Record<string, string[]>;
  data?: { user: IUser; token: string };
}

async function authRequest(path: string, body: object) {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthRequestError("AUTH_UNAVAILABLE", "AUTH_UNAVAILABLE");
  }

  let json: ApiResult;
  try {
    json = await response.json();
  } catch {
    throw new AuthRequestError("AUTH_UNAVAILABLE", "AUTH_UNAVAILABLE");
  }

  if (!response.ok || !json.success || !json.data) {
    const detail = json.details
      ? Object.values(json.details).flat().join(" - ")
      : null;
    const code = json.error && /^[A-Z_]+$/.test(json.error) ? json.error : undefined;
    throw new AuthRequestError(detail || json.error || "Authentication failed", code);
  }

  return json.data;
}

export function useAuth() {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const fetchMe = useCallback(async (storedToken: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      const json = await res.json();
      if (res.ok && json.success) setUser(json.data);
      else logout();
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      void fetchMe(stored);
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const persistSession = useCallback((data: { user: IUser; token: string }) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    return persistSession(await authRequest("/api/auth/login", { email, password }));
  }, [persistSession]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    return persistSession(await authRequest("/api/auth/register", { name, email, password }));
  }, [persistSession]);

  return { user, token, loading, login, register, logout };
}
