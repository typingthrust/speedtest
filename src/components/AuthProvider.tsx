import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ClerkProvider, useUser, useClerk, useSignIn, useSignUp } from '@clerk/clerk-react';

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
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Clerk hooks
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  // Map Clerk user to UserProfile shape
  const user = clerkUser && isLoaded ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || null,
    username: clerkUser.username || undefined,
    avatar_url: clerkUser.imageUrl || undefined,
  } : null;
  // Provide dummy methods for compatibility (can be expanded for custom flows)
  const loginWithGoogle = async () => { window.location.href = '/sign-in'; };
  const loginWithPassword = async () => { window.location.href = '/sign-in'; };
  const loginAsGuest = () => { window.location.href = '/sign-in'; };
  const logout = async () => { await signOut(); };
  return (
    <AuthContext.Provider value={{ user, loading: !isLoaded, loginWithGoogle, loginWithPassword, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
} 