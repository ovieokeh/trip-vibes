"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserSyncStatus } from "@/lib/auth-actions";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  isAnonymous: boolean;
  isSynced: boolean;
  credits: number;
  loading: boolean;
  refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAnonymous: true,
  isSynced: false,
  credits: 0,
  loading: true,
  refreshCredits: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSynced, setIsSynced] = useState(false);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Fetch user status from our database (via server action)
  // Does NOT auto-create user - just checks if they exist
  const fetchUserStatus = async (): Promise<boolean> => {
    try {
      const status = await getUserSyncStatus();
      if (status) {
        setCredits(status.credits);
        setIsAnonymous(status.isAnonymous);
        setIsSynced(true);
        return true;
      }
    } catch (e) {
      console.error("Failed to fetch user status:", e);
    }
    setIsSynced(false);
    setCredits(0);
    return false;
  };

  const refreshCredits = async () => {
    await fetchUserStatus();
  };

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        setIsAnonymous(user.is_anonymous ?? true);
        // Only check if user exists in our DB, DO NOT auto-create
        await fetchUserStatus();
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        setIsAnonymous(currentUser.is_anonymous ?? true);

        // On SIGNED_IN (e.g., after email verification), ensure user is synced to DB
        if (event === "SIGNED_IN") {
          const { syncUserToDatabase } = await import("@/lib/auth-actions");
          await syncUserToDatabase();
        }

        // Check DB status
        await fetchUserStatus();
      } else {
        setCredits(0);
        setIsAnonymous(true);
        setIsSynced(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAnonymous, isSynced, credits, loading, refreshCredits }}>
      {children}
    </AuthContext.Provider>
  );
}
