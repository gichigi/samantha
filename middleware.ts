import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Create a response object to modify
  const response = NextResponse.next()
  
  // Create supabase client with simple cookie configuration
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Optional: Refresh the session if it exists
  await supabase.auth.getSession()

  // No cache for routes that might have auth state
  response.headers.set("x-middleware-cache", "no-cache")

  return response
}

// Run middleware on API routes and auth routes
export const config = {
  matcher: ["/api/:path*", "/auth/:path*"],
}
