import { createClient } from "@supabase/supabase-js"

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
  
  // Create client with default settings
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Client-side Supabase client
let supabaseClient: ReturnType<typeof createClientInstance> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient && typeof window !== "undefined") {
    try {
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
    return createClient(serverSupabaseUrl, serverSupabaseKey, {
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
