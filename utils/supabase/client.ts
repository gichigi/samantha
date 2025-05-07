import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Legacy export to avoid breaking code during migration
export const createSupabaseClient = createClient

// For singleton usage
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseInstance && typeof window !== 'undefined') {
    supabaseInstance = createClient()
  }
  return supabaseInstance
} 