import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          const cookies = document.cookie.split('; ')
          const cookie = cookies.find(c => c.startsWith(`${name}=`))
          return cookie ? cookie.split('=')[1] : undefined
        },
        set(name, value, options) {
          let cookie = `${name}=${value}`
          if (options?.maxAge) {
            cookie += `; Max-Age=${options.maxAge}`
          }
          if (options?.path) {
            cookie += `; Path=${options.path}`
          }
          document.cookie = cookie
        },
        remove(name, options) {
          document.cookie = `${name}=; Max-Age=0${options?.path ? `; Path=${options.path}` : ''}`
        }
      }
    }
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