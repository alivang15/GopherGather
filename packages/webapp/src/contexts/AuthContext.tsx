"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateAndSetupSession = async () => {
      try {
        // Check for stored session preferences
        const sessionExpiration = localStorage.getItem('sessionExpiration');
        const rememberMe = localStorage.getItem('rememberMe') === 'true';
        const sessionType = localStorage.getItem('sessionType');
        
        console.log('🔍 Checking stored session:', { rememberMe, sessionType, sessionExpiration });

        // If we have session preferences, check if they're still valid
        if (sessionExpiration) {
          const expirationDate = new Date(sessionExpiration);
          const now = new Date();
          
          if (now > expirationDate) {
            console.log('⏰ Session expired, signing out...');
            await supabase.auth.signOut();
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('sessionExpiration');
            localStorage.removeItem('sessionType');
            setLoading(false);
            return;
          }
        }

        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('✅ Valid session found:', session.user.email);
          setUser(session.user);
          
          // If no stored preferences but we have a session, set default
          if (!sessionExpiration) {
            const defaultExpiration = new Date();
            defaultExpiration.setDate(defaultExpiration.getDate() + 3); // 3 days default
            localStorage.setItem('sessionExpiration', defaultExpiration.toISOString());
            localStorage.setItem('sessionType', 'campus-standard');
          }
        } else {
          console.log('📭 No active session');
          // Clean up any stale session data
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('sessionExpiration');
          localStorage.removeItem('sessionType');
        }
      } catch (error) {
        console.error('❌ Error validating session:', error);
      } finally {
        setLoading(false);
      }
    };

    validateAndSetupSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          // Clean up session data
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('sessionExpiration');
          localStorage.removeItem('sessionType');
        }
      }
    );

    // Set up periodic session validation
    const validationInterval = setInterval(() => {
      const sessionExpiration = localStorage.getItem('sessionExpiration');
      if (sessionExpiration) {
        const expirationDate = new Date(sessionExpiration);
        const now = new Date();
        
        if (now > expirationDate) {
          console.log('⏰ Session expired during validation, signing out...');
          signOut();
        }
      }
    }, CAMPUS_SESSION_CONFIG.VALIDATION_INTERVAL);

    return () => {
      subscription.unsubscribe();
      clearInterval(validationInterval);
    };
  }, []);

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    console.log('🔄 Campus sign in:', email, rememberMe ? '(14-day session)' : '(3-day session)');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
    
    if (data.user) {
      console.log('✅ User signed in successfully');
      setUser(data.user);
      
      // Set campus-appropriate session duration
      const expirationDate = new Date();
      const sessionDuration = rememberMe ? 14 : 3; // 14 days vs 3 days
      expirationDate.setDate(expirationDate.getDate() + sessionDuration);
      
      // Store session preferences
      localStorage.setItem('sessionExpiration', expirationDate.toISOString());
      
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('sessionType', 'campus-extended');
        console.log('💾 14-day campus session established (perfect for bi-weekly events)');
      } else {
        localStorage.setItem('sessionType', 'campus-standard');
        console.log('💾 3-day campus session established');
      }
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log('🔄 Attempting sign up for:', email);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    }
    
    console.log('✅ Sign up successful - check email for verification');
  };

  const signOut = async () => {
    console.log('🔄 Signing out...');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
    
    // Clean up session data
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('sessionExpiration');
    localStorage.removeItem('sessionType');
    setUser(null);
    console.log('✅ Signed out successfully');
  };

  const resetPassword = async (email: string) => {
    console.log('🔄 Attempting password reset for:', email);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    if (error) {
      console.error('❌ Password reset error:', error);
      throw error;
    }
    
    console.log('✅ Password reset email sent');
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
