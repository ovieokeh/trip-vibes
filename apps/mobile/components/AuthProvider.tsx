import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";
import type { User, Session, UserAttributes } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAnonymous: boolean;
  loading: boolean;
  credits: number;
  refreshCredits: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInAnonymously: () => Promise<{ error: Error | null }>;
  updateUser: (attributes: UserAttributes) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAnonymous: true,
  loading: true,
  credits: 0,
  refreshCredits: async () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInAnonymously: async () => ({ error: null }),
  updateUser: async () => ({ error: null }),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);

  const refreshCredits = useCallback(async () => {
    try {
      const response = await api<{ credits: number }>("/api/user/credits");
      setCredits(response.credits ?? 0);
    } catch (error) {
      console.error("[AuthProvider] Error refreshing credits:", error);
    }
  }, []);

  // Handle app state changes to refresh session when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const signInAnonymously = async (): Promise<{ error: Error | null }> => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) return { error };

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        setIsAnonymous(data.user?.is_anonymous ?? true);
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Initialize and listen to auth state changes
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setSession(session);
          setUser(session.user);
          setIsAnonymous(session.user.is_anonymous ?? false);
        } else {
          // If no session, sign in anonymously
          await signInAnonymously();
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAnonymous(session?.user?.is_anonymous ?? true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { error };
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        return { error };
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateUser = async (attributes: UserAttributes): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.updateUser(attributes);
      if (error) {
        return { error };
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAnonymous(true);
    // Optionally re-sign in anonymously after sign out?
    // For now, leave as is, or trigger a re-init.
    await signInAnonymously();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAnonymous,
        loading,
        credits,
        refreshCredits,
        signIn,
        signUp,
        signInAnonymously,
        updateUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
