import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const createClient = async () => {
  // Create a cookies instance
  const cookieStore = cookies()
  
  // Get all cookies as a simple key-value object
  const cookieObject: Record<string, string> = {}
  for (const cookie of cookieStore.getAll()) {
    cookieObject[cookie.name] = cookie.value
  }
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieObject[name]
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Legacy export to avoid breaking code during migration
export const createServerSupabaseClient = createClient 