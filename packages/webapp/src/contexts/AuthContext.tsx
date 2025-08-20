"use client";

import { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Campus-specific session configuration
const CAMPUS_SESSION_CONFIG = {
  // Short session for shared/lab computers
  DEFAULT_DURATION: 3 * 24 * 60 * 60 * 1000, // 3 days

  // Remember me for personal devices (perfect for bi-weekly event cycles)
  REMEMBER_ME_DURATION: 14 * 24 * 60 * 60 * 1000, // 14 days

  // Force re-auth for sensitive operations
  SENSITIVE_OPERATION_TIMEOUT: 1 * 60 * 60 * 1000, // 1 hour

  // Session validation interval
  VALIDATION_INTERVAL: 30 * 60 * 1000, // 30 minutes
};

const isBrowser = typeof window !== "undefined";

const resetCooldowns = new Map<string, number>();

// Defaults: 15m cooldown, 5/day (override via env)
const DEFAULT_RESET_COOLDOWN_MS =
  process.env.NODE_ENV === "production" ? 900_000 : 60_000; // 15m prod, 1m dev
const RESET_COOLDOWN_MS = Number(
  process.env.NEXT_PUBLIC_RESET_COOLDOWN_MS ?? DEFAULT_RESET_COOLDOWN_MS
);
const RESET_MAX_PER_DAY = Number(process.env.NEXT_PUBLIC_RESET_MAX_PER_DAY ?? 5);

function getLastResetTs(email: string): number {
  const mem = resetCooldowns.get(email);
  if (mem) return mem;
  if (!isBrowser) return 0;
  const v = window.localStorage.getItem(`reset:last:${email}`);
  return v ? Number(v) : 0;
}
function setLastResetTs(email: string, ts: number) {
  resetCooldowns.set(email, ts);
  if (isBrowser) window.localStorage.setItem(`reset:last:${email}`, String(ts));
}
function dayKey(email: string) {
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  return `reset:count:${email}:${day}`;
}
function getDailyCount(email: string) {
  if (!isBrowser) return 0;
  const v = window.localStorage.getItem(dayKey(email));
  return v ? Number(v) : 0;
}
function incDailyCount(email: string) {
  if (!isBrowser) return 0;
  const key = dayKey(email);
  const next = getDailyCount(email) + 1;
  window.localStorage.setItem(key, String(next));
  return next;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await supabase.auth.getUser();
      const next = res?.data?.user ?? null;
      // only update if user id actually changed
      setUser(prev => (prev?.id === next?.id ? prev : next));
    } catch (err) {
      console.error("refreshUser failed", err);
    }
  };

  useEffect(() => {
    const validateAndSetupSession = async () => {
      try {
        const sessionExpiration = localStorage.getItem("sessionExpiration");
        const rememberMe = localStorage.getItem("rememberMe") === "true";
        const sessionType = localStorage.getItem("sessionType");
        console.log("🔍 Checking stored session:", { rememberMe, sessionType, sessionExpiration });

        if (sessionExpiration) {
          const expirationDate = new Date(sessionExpiration);
          if (new Date() > expirationDate) {
            console.log("⏰ Session expired, signing out...");
            await supabase.auth.signOut();
            localStorage.removeItem("rememberMe");
            localStorage.removeItem("sessionExpiration");
            localStorage.removeItem("sessionType");
            setLoading(false);
            return;
          }
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("❌ Session error:", error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          // set only if changed
          setUser(prev => (prev?.id === session.user!.id ? prev : session.user!));
          if (!sessionExpiration) {
            const defaultExpiration = new Date();
            defaultExpiration.setDate(defaultExpiration.getDate() + 3);
            localStorage.setItem("sessionExpiration", defaultExpiration.toISOString());
            localStorage.setItem("sessionType", "campus-standard");
          }
        } else {
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("sessionExpiration");
          localStorage.removeItem("sessionType");
        }
      } catch (error) {
        console.error("❌ Error validating session:", error);
      } finally {
        setLoading(false);
      }
    };

    validateAndSetupSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only set when different to avoid re-renders
        if (event === "SIGNED_IN" && session?.user) {
          setUser(prev => (prev?.id === session.user!.id ? prev : session.user!));
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("sessionExpiration");
          localStorage.removeItem("sessionType");
        }
      }
    );

    const validationInterval = setInterval(() => {
      const sessionExpiration = localStorage.getItem("sessionExpiration");
      if (sessionExpiration && new Date() > new Date(sessionExpiration)) {
        console.log("⏰ Session expired during validation, signing out...");
        // signOut is stable; calling it is fine
        supabase.auth.signOut().catch(() => {});
      }
    }, CAMPUS_SESSION_CONFIG.VALIDATION_INTERVAL);

    return () => {
      subscription.unsubscribe();
      clearInterval(validationInterval);
    };
  }, []);

  // ensure context has latest user on mount
  useEffect(() => {
    void refreshUser();
  }, []);

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    console.log("🔄 Campus sign in:", email, rememberMe ? "(14-day session)" : "(3-day session)");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ Sign in error:", error);
      throw error;
    }

    if (data.user) {
      console.log("✅ User signed in successfully");
      setUser(data.user);

      // Set campus-appropriate session duration
      const expirationDate = new Date();
      const sessionDuration = rememberMe ? 14 : 3; // 14 days vs 3 days
      expirationDate.setDate(expirationDate.getDate() + sessionDuration);

      // Store session preferences
      localStorage.setItem("sessionExpiration", expirationDate.toISOString());

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("sessionType", "campus-extended");
        console.log("💾 14-day campus session established (perfect for bi-weekly events)");
      } else {
        localStorage.setItem("sessionType", "campus-standard");
        console.log("💾 3-day campus session established");
      }
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log("🔄 Attempting sign up for:", email);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("❌ Sign up error:", error);
      throw error;
    }

    console.log("✅ Sign up successful - check email for verification");
  };

  const signOut = async () => {
    console.log("🔄 Signing out...");
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("❌ Sign out error:", error);
      throw error;
    }

    // Clean up session data
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("sessionExpiration");
    localStorage.removeItem("sessionType");
    setUser(null);
    console.log("✅ Signed out successfully");
  };

  const resetPassword = async (email: string) => {
    console.log("🔄 Attempting password reset for:", email);

    // daily cap
    const usedToday = getDailyCount(email);
    if (usedToday >= RESET_MAX_PER_DAY) {
      throw new Error("Daily reset limit reached. Please try again tomorrow.");
    }

    // cooldown
    const now = Date.now();
    const last = getLastResetTs(email);
    if (now - last < RESET_COOLDOWN_MS) {
      const remainSec = Math.ceil((RESET_COOLDOWN_MS - (now - last)) / 1000);
      throw new Error(`Please wait ${remainSec}s before requesting another reset email.`);
    }

    // optimistic set to prevent double-click spam
    setLastResetTs(email, now);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      console.error("❌ Password reset error:", error);
      throw error;
    }

    incDailyCount(email);
    console.log("✅ Password reset email sent");
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshUser,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
