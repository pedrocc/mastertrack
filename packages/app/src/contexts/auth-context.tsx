import type { UserRole, UserWithCompany } from "@mastertrack/shared";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, handleResponse } from "../lib/api";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

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
  // isLoading stays TRUE until we have complete user data (including DB fetch)
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

  // Initialize auth state from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      console.log("[Auth] onAuthStateChange:", event, "session:", !!newSession);

      setSession(newSession);

      if (newSession?.user) {
        // Set Supabase data as immediate fallback (but keep loading = true)
        setUser(supabaseUserToAppUser(newSession.user));

        // Fetch from DB and ONLY set loading = false after completion
        if (newSession.user.email) {
          try {
            const dbUser = await fetchUserFromDb(newSession.user.email);
            if (isMounted) {
              if (dbUser) {
                setUser(dbUser);
              }
              setIsLoading(false);
              console.log("[Auth] DB fetch complete, loading = false");
            }
          } catch (error) {
            console.error("[Auth] DB fetch failed:", error);
            if (isMounted) {
              setIsLoading(false); // Still set loading false on error
            }
          }
        } else {
          setIsLoading(false);
        }
      } else {
        // Not authenticated
        setUser(null);
        setIsLoading(false);
        console.log("[Auth] No session, loading = false");
      }
    });

    // Fallback timeout
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log("[Auth] Timeout reached, forcing loading = false");
        setIsLoading(false);
      }
    }, 5000);

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
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase nao configurado");
      }

      // Keep loading true during login
      setIsLoading(true);

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
          } catch (error) {
            console.error("[Auth] Login DB fetch failed:", error);
          }
        }

        // Only set loading false after everything is done
        setIsLoading(false);
      }
    },
    [fetchUserFromDb]
  );

  const logout = useCallback(async () => {
    setUser(null);
    setSession(null);
    setIsLoading(false);

    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (error) {
        console.error("[Auth] signOut failed:", error);
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
