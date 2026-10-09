"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  clearAuthToken,
  fetchMe,
  getApiErrorMessage,
  getAuthToken,
  login as apiLogin,
  logout as apiLogout,
  signup as apiSignup,
} from "@/lib/api";
import type { AuthUser } from "@/lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Bump to refetch profile photos after upload/delete. */
  photoVersion: number;
  bumpPhotoVersion: () => void;
  login: (input: { email: string; password: string }) => Promise<AuthUser>;
  signup: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  photoVersion: 0,
  bumpPhotoVersion: () => {},
  login: async () => {
    throw new Error("AuthProvider not mounted");
  },
  signup: async () => {
    throw new Error("AuthProvider not mounted");
  },
  logout: () => {},
  refresh: async () => {},
  setUser: () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [photoVersion, setPhotoVersion] = useState(0);

  const bumpPhotoVersion = useCallback(() => {
    setPhotoVersion((v) => v + 1);
  }, []);

  const refresh = useCallback(async () => {
    const stored = getAuthToken();
    if (!stored) {
      setUser(null);
      setToken(null);
      return;
    }
    setToken(stored);
    try {
      const me = await fetchMe();
      setUser(me);
    } catch (err) {
      // Token invalid/expired — clear it so proxy + UI agree.
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        (err as { response?: { status?: number } }).response?.status === 401
      ) {
        clearAuthToken();
        setUser(null);
        setToken(null);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refresh();
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const login = useCallback(async (input: { email: string; password: string }) => {
    const payload = await apiLogin(input);
    setToken(payload.token);
    setUser(payload.user);
    // Best-effort: /me returns the canonical profile shape.
    try {
      const me = await fetchMe();
      setUser(me);
      return me;
    } catch {
      return payload.user;
    }
  }, []);

  const signup = useCallback(
    async (input: {
      name: string;
      email: string;
      phone: string;
      password: string;
    }) => {
      const payload = await apiSignup(input);
      setToken(payload.token);
      setUser(payload.user);
      try {
        const me = await fetchMe();
        setUser(me);
        return me;
      } catch {
        return payload.user;
      }
    },
    []
  );

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    setToken(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(token && user),
      photoVersion,
      bumpPhotoVersion,
      login,
      signup,
      logout,
      refresh,
      setUser,
    }),
    [user, token, isLoading, photoVersion, bumpPhotoVersion, login, signup, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { getApiErrorMessage };
