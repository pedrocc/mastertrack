import type { UserRole, UserWithCompany } from "@mastertrack/shared";
import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api, handleResponse } from "../lib/api";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

interface AuthContextType {
  user: UserWithCompany | null;
  isLoading: boolean;
  isUserDataFromDb: boolean;
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
  const [isUserDataFromDb, setIsUserDataFromDb] = useState(false);

  // Track if we're in the middle of a login to prevent duplicate DB fetches
  const isLoginInProgress = useRef(false);
  // Track if DB fetch has been completed for current session
  const dbFetchCompleted = useRef(false);

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

  // Load user data from DB and set isUserDataFromDb flag
  const loadUserDataFromDb = useCallback(
    async (email: string, isMounted: () => boolean) => {
      const dbUser = await fetchUserFromDb(email);
      if (isMounted()) {
        if (dbUser) {
          setUser(dbUser);
        }
        setIsUserDataFromDb(true);
        dbFetchCompleted.current = true;
      }
    },
    [fetchUserFromDb]
  );

  // Initialize auth state from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const isMountedFn = () => isMounted;

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;

      console.log("[Auth] onAuthStateChange:", event, "session:", !!newSession);

      setSession(newSession);

      if (newSession?.user) {
        // Set Supabase data as immediate fallback
        setUser(supabaseUserToAppUser(newSession.user));
        setIsLoading(false);

        // Only fetch from DB if:
        // 1. Login is not in progress (login() handles its own DB fetch)
        // 2. DB fetch hasn't been completed for this session yet
        if (!isLoginInProgress.current && !dbFetchCompleted.current && newSession.user.email) {
          loadUserDataFromDb(newSession.user.email, isMountedFn);
        }
      } else {
        // Logged out
        setUser(null);
        setIsUserDataFromDb(false);
        setIsLoading(false);
        dbFetchCompleted.current = false;
      }
    });

    // Fallback timeout
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [loadUserDataFromDb]);

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

      // Mark login in progress to prevent onAuthStateChange from doing duplicate DB fetch
      isLoginInProgress.current = true;
      dbFetchCompleted.current = false;
      setIsUserDataFromDb(false);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.user) {
          setSession(data.session);

          // Set Supabase data immediately
          setUser(supabaseUserToAppUser(data.user));

          // Then fetch from DB and wait for it
          if (data.user.email) {
            const dbUser = await fetchUserFromDb(data.user.email);
            if (dbUser) {
              setUser(dbUser);
            }
            setIsUserDataFromDb(true);
            dbFetchCompleted.current = true;
          } else {
            setIsUserDataFromDb(true);
            dbFetchCompleted.current = true;
          }
        }
      } finally {
        isLoginInProgress.current = false;
      }
    },
    [fetchUserFromDb]
  );

  const logout = useCallback(async () => {
    // Reset refs
    dbFetchCompleted.current = false;
    isLoginInProgress.current = false;

    // Clear local state immediately
    setUser(null);
    setSession(null);
    setIsUserDataFromDb(false);

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
      isUserDataFromDb,
      isAuthenticated: user !== null,
      login,
      logout,
      isAdmin: user?.role === "admin",
      session,
      refreshUser,
    }),
    [user, isLoading, isUserDataFromDb, login, logout, session, refreshUser]
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
