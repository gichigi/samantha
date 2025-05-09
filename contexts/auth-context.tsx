"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [supabaseError, setSupabaseError] = useState<string | null>(null)
  
  // Safely get Supabase client, catch any initialization errors
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    setSupabaseError((error as Error).message);
    setIsLoading(false);
  }

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Check for active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    }).catch(error => {
      console.error("Error checking auth session:", error);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase])

  const signInWithGoogle = async () => {
    if (!supabase) {
      console.error("Cannot sign in: Supabase client not initialized");
      return;
    }
    
    try {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  }

  const signOut = async () => {
    if (!supabase) {
      console.error("Cannot sign out: Supabase client not initialized");
      return;
    }
    
    try {
    await supabase.auth.signOut()
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
