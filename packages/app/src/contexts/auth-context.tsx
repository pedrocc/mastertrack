import type { AuthUser, UserRole } from "@mastertrack/shared";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users for development (in production, this would use Supabase Auth)
const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
  "admin@mastertrack.com": {
    password: "admin123",
    user: {
      id: "1",
      email: "admin@mastertrack.com",
      name: "Administrador",
      role: "admin" as UserRole,
    },
  },
  "user@mastertrack.com": {
    password: "user123",
    user: {
      id: "2",
      email: "user@mastertrack.com",
      name: "Usuario Teste",
      role: "user" as UserRole,
    },
  },
};

const AUTH_STORAGE_KEY = "mastertrack_auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (!mockUser || mockUser.password !== password) {
      throw new Error("Email ou senha invalidos");
    }

    setUser(mockUser.user);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser.user));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      isAdmin: user?.role === "admin",
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
