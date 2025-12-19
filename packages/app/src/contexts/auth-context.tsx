import type { UserRole, UserWithCompany } from "@mastertrack/shared";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  api,
  clearLocalAuthToken,
  getLocalAuthToken,
  handleResponse,
  setLocalAuthToken,
} from "../lib/api";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

// Debug: log at module level
console.log("[Auth Module] Loaded, isSupabaseConfigured:", isSupabaseConfigured());

interface AuthContextType {
  user: UserWithCompany | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  session: Session | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Database user type from API
interface DbUser {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Database company type from API
interface DbCompany {
  id: string;
  name: string;
}

// Helper to convert Supabase user to app user (fallback when API unavailable)
function supabaseUserToAppUser(user: User): UserWithCompany {
  const role = (user.user_metadata?.["role"] as UserRole) || "user";

  return {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.["name"] || user.email?.split("@")[0] || "Usuario",
    role,
  };
}

// Helper to convert database user to app user
function dbUserToAppUser(dbUser: DbUser, companyName?: string): UserWithCompany {
  const result: UserWithCompany = {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role as UserRole,
  };

  if (dbUser.companyId) {
    result.companyId = dbUser.companyId;
  }
  if (companyName) {
    result.companyName = companyName;
  }

  return result;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserWithCompany | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data from database API by email
  const fetchUserFromDb = useCallback(async (email: string): Promise<UserWithCompany | null> => {
    try {
      const res = await api.api.users["by-email"][":email"].$get({ param: { email } });
      const data = await handleResponse<{ data: DbUser }>(res);
      const dbUser = data.data;

      // If user has a company, fetch company name
      let companyName: string | undefined;
      if (dbUser.companyId) {
        try {
          const companyRes = await api.api.companies[":id"].$get({
            param: { id: dbUser.companyId },
          });
          const companyData = await handleResponse<{ data: DbCompany }>(companyRes);
          companyName = companyData.data.name;
        } catch {
          // Company fetch failed, continue without company name
        }
      }

      return dbUserToAppUser(dbUser, companyName);
    } catch {
      return null;
    }
  }, []);

  // Refresh user data from database
  const refreshUser = useCallback(async () => {
    if (!session?.user?.email) return;

    const dbUser = await fetchUserFromDb(session.user.email);
    if (dbUser) {
      setUser(dbUser);
    }
  }, [session, fetchUserFromDb]);

  // Initialize auth state from Supabase or local token
  useEffect(() => {
    let isMounted = true;

    // Timeout fallback - if everything takes more than 5 seconds, show the page
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 5000);

    console.log("[Auth] Init - isSupabaseConfigured:", isSupabaseConfigured());

    // Em desenvolvimento sem Supabase, verificar token local
    if (!isSupabaseConfigured()) {
      const localToken = getLocalAuthToken();
      console.log("[Auth] Local auth mode - token exists:", !!localToken);
      if (localToken) {
        // Tentar recuperar dados do usuario do localStorage
        const storedUser = localStorage.getItem("mastertrack_local_user");
        console.log("[Auth] Stored user:", storedUser);
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser) as UserWithCompany;
            console.log("[Auth] Parsed user:", parsedUser);
            setUser(parsedUser);
          } catch (err) {
            // Token invalido, limpar
            console.error("[Auth] Failed to parse user:", err);
            clearLocalAuthToken();
            localStorage.removeItem("mastertrack_local_user");
          }
        }
      }
      setIsLoading(false);
      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
      };
    }

    // Listen for auth changes - this fires immediately with INITIAL_SESSION
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);

      if (newSession?.user) {
        // Set basic user info from Supabase first
        setUser(supabaseUserToAppUser(newSession.user));

        // Fetch full user data from DB before stopping loading
        if (newSession.user.email) {
          const dbUser = await fetchUserFromDb(newSession.user.email);
          if (isMounted && dbUser) {
            setUser(dbUser);
          }
        }

        // Only stop loading after DB fetch completes
        if (isMounted) {
          setIsLoading(false);
        }
      } else {
        // No session - stop loading and show login
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchUserFromDb]);

  // Refresh user data when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && session?.user) {
        refreshUser();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session, refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);

      // Em desenvolvimento sem Supabase, usar login local
      if (!isSupabaseConfigured()) {
        try {
          const res = await api.api.auth["local-login"].$post({
            json: { email },
          });

          if (!res.ok) {
            const errorData = (await res.json()) as { error?: { message?: string } };
            throw new Error(errorData.error?.message || "Falha no login local");
          }

          const data = (await res.json()) as {
            data: {
              user: {
                id: string;
                email: string;
                name: string;
                role: string;
                companyId: string | null;
                avatarUrl: string | null;
              };
              token: string;
            };
          };

          const localUser: UserWithCompany = {
            id: data.data.user.id,
            email: data.data.user.email,
            name: data.data.user.name,
            role: data.data.user.role as UserRole,
          };

          if (data.data.user.companyId) {
            localUser.companyId = data.data.user.companyId;
          }

          // Salvar token e usuario
          setLocalAuthToken(data.data.token);
          localStorage.setItem("mastertrack_local_user", JSON.stringify(localUser));
          setUser(localUser);
          setIsLoading(false);
          return;
        } catch (err) {
          setIsLoading(false);
          throw err;
        }
      }

      if (!supabase) {
        throw new Error("Supabase nao configurado");
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setIsLoading(false);
        throw new Error(error.message);
      }

      if (data.user) {
        setSession(data.session);
        setUser(supabaseUserToAppUser(data.user));

        // Fetch from DB and wait
        if (data.user.email) {
          try {
            const dbUser = await fetchUserFromDb(data.user.email);
            if (dbUser) {
              setUser(dbUser);
            }
          } catch (err) {
            console.error("[Auth] Login DB fetch failed:", err);
          }
        }

        setIsLoading(false);
      }
    },
    [fetchUserFromDb]
  );

  const logout = useCallback(async () => {
    setUser(null);
    setSession(null);

    // Limpar auth local
    clearLocalAuthToken();
    localStorage.removeItem("mastertrack_local_user");

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (err) {
        console.error("[Auth] signOut failed:", err);
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      isAdmin: user?.role === "admin",
      session,
      refreshUser,
    }),
    [user, isLoading, login, logout, session, refreshUser]
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
