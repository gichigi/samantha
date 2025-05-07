import { createClient } from "@supabase/supabase-js"
import { Database } from "../types/supabase"

// Get environment variables with defaults that allow development without credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Create a singleton instance of the Supabase client
export const createClientInstance = () => {
  // For development mode, we'll allow missing environment variables
  // but log warnings about them
  if (process.env.NODE_ENV === 'development') {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL is not defined. Supabase functionality will be limited.')
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined. Supabase functionality will be limited.')
    }
  }
  
  // Create client with cookie-based auth instead of localStorage
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'sb-auth-token',
      persistSession: true,
      // Use cookies for storing tokens with domain settings for cross-port compatibility
      storage: {
        getItem: (key) => {
          // Get from cookies
          const cookies = document.cookie.split(';')
          const cookie = cookies.find(c => c.trim().startsWith(`${key}=`))
          if (!cookie) return null
          return cookie.split('=')[1]
        },
        setItem: (key, value) => {
          // Set cookie for cross-port compatibility
          // Use domain=localhost to work across different ports (3000, 3001, 3002, etc.)
          const isDev = process.env.NODE_ENV === 'development'
          if (isDev) {
            // Development settings: works across all localhost ports
            document.cookie = `${key}=${value}; path=/; max-age=2592000; domain=localhost; SameSite=Lax`
          } else {
            // Production settings: more secure
            document.cookie = `${key}=${value}; path=/; max-age=2592000; SameSite=Lax; Secure`
          }
          console.log(`Set auth cookie: ${key} (value truncated for security)`)
        },
        removeItem: (key) => {
          // Remove cookie using same domain settings
          const isDev = process.env.NODE_ENV === 'development'
          if (isDev) {
            document.cookie = `${key}=; path=/; max-age=0; domain=localhost`
          } else {
            document.cookie = `${key}=; path=/; max-age=0; Secure`
          }
        }
      }
    }
  })
}

// Client-side Supabase client
let supabaseClient: ReturnType<typeof createClientInstance> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient && typeof window !== "undefined") {
    try {
      // Force clear any existing auth cookies to prevent stale data
      if (typeof window !== "undefined") {
        document.cookie = 'sb-auth-token=; path=/; max-age=0; domain=localhost'
      }
      
      supabaseClient = createClientInstance()
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
      return null
    }
  }
  return supabaseClient
}

// Server-side Supabase client (for server components and API routes)
export const createServerSupabaseClient = () => {
  const serverSupabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serverSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!serverSupabaseUrl || !serverSupabaseKey) {
    console.error('Missing required environment variables for server-side Supabase client')
    return null
  }
  
  try {
    return createClient<Database>(serverSupabaseUrl, serverSupabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  } catch (error) {
    console.error('Failed to create server-side Supabase client:', error)
    return null
  }
}
