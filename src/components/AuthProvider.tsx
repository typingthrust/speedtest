import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface UserProfile {
  id: string;
  email: string | null;
  username?: string;
  avatar_url?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  session: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        setSession(data.session);
        const supaUser = data.session.user;
        setUser({
          id: supaUser.id,
          email: supaUser.email,
          username: supaUser.user_metadata?.username || undefined,
          avatar_url: supaUser.user_metadata?.avatar_url || undefined,
        });
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username || undefined,
          avatar_url: session.user.user_metadata?.avatar_url || undefined,
        });
      } else {
        setUser(null);
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({ provider: 'google' });
    setLoading(false);
  };
  const loginWithPassword = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) throw error;
  };
  const signUpWithPassword = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) throw error;
  };
  const loginAsGuest = () => {
    setUser({ id: 'guest', email: null });
    setSession(null);
  };
  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setLoading(false);
  };
  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithPassword, signUpWithPassword, loginAsGuest, logout, session }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
} 