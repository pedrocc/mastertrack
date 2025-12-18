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
// NOTE: We intentionally don't use companyId/companyName from Supabase metadata
// because it may contain placeholder values. The real companyId comes from Postgres.
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
      // API call failed, return null to use fallback
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

  // Load user data (first from Supabase, then refresh from DB)
  const loadUserData = useCallback(
    async (supabaseUser: User) => {
      // Set initial data from Supabase immediately (for fast UI)
      setUser(supabaseUserToAppUser(supabaseUser));

      // Then fetch fresh data from database by email
      if (supabaseUser.email) {
        const dbUser = await fetchUserFromDb(supabaseUser.email);
        if (dbUser) {
          setUser(dbUser);
        }
      }
    },
    [fetchUserFromDb]
  );

  // Initialize auth state from Supabase
  useEffect(() => {
    console.log("[Auth] Starting auth initialization...");
    console.log("[Auth] Supabase configured:", isSupabaseConfigured());

    if (!isSupabaseConfigured()) {
      console.log("[Auth] Supabase not configured, setting loading to false");
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let initialAuthChecked = false;

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      console.log("[Auth] onAuthStateChange event:", event, "session:", !!session);

      setSession(session);
      if (session?.user) {
        // Set Supabase data immediately as fallback
        setUser(supabaseUserToAppUser(session.user));

        // Mark auth as checked IMMEDIATELY (don't wait for DB fetch)
        if (!initialAuthChecked) {
          initialAuthChecked = true;
          setIsLoading(false);
          console.log("[Auth] Initial auth check complete, loading set to false");
        }

        // Then fetch fresh data from database in background (non-blocking)
        if (session.user.email) {
          fetchUserFromDb(session.user.email)
            .then((dbUser) => {
              if (isMounted && dbUser) {
                setUser(dbUser);
                console.log("[Auth] User data refreshed from database");
              }
            })
            .catch((error) => {
              console.error("Failed to load user data on auth change:", error);
            });
        }
      } else {
        setUser(null);
        // Mark auth as checked for logout case too
        if (!initialAuthChecked) {
          initialAuthChecked = true;
          setIsLoading(false);
          console.log("[Auth] Initial auth check complete (no session), loading set to false");
        }
      }
    });

    // Fallback timeout in case onAuthStateChange doesn't fire
    const timeoutId = setTimeout(() => {
      if (isMounted && !initialAuthChecked) {
        console.log("[Auth] Timeout reached, setting loading to false");
        initialAuthChecked = true;
        setIsLoading(false);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchUserFromDb]);

  // Refresh user data when tab becomes visible (to get updated data from admin changes)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && session?.user) {
        console.log("[Auth] Tab became visible, refreshing user data...");
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

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        setSession(data.session);
        await loadUserData(data.user);
      }
    },
    [loadUserData]
  );

  const logout = useCallback(async () => {
    console.log("[Auth] Logging out...");

    // Clear local state immediately for instant feedback
    setUser(null);
    setSession(null);

    // Sign out from Supabase and wait for it to complete
    if (isSupabaseConfigured()) {
      try {
        // Use scope: 'local' to clear the local session
        const { error } = await supabase.auth.signOut({ scope: "local" });
        if (error) {
          console.error("[Auth] signOut error:", error);
        } else {
          console.log("[Auth] signOut successful");
        }
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
