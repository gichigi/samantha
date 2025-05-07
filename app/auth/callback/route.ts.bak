import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin, hash } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/'
  const error = searchParams.get('error')

  // Handle errors explicitly
  if (error) {
    console.error(`Auth error: ${error}`)
    return NextResponse.redirect(`${origin}?error=${encodeURIComponent(error)}`)
  }

  // Create a response to use for setting cookies
  const response = NextResponse.redirect(`${origin}${next}`)

  // Create supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          // Use the request cookies directly
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          // Set cookies on the response
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          // Remove cookies from the response
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // If we have a code, use code exchange flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error.message)
      return NextResponse.redirect(`${origin}?error=${encodeURIComponent(error.message)}`)
    }
    
    // Redirect with the response that contains the session cookies
    return response
  }

  // If we don't have a code but have a hash, it might be using implicit grant
  if (hash && hash.includes('access_token')) {
    // Just redirect to the main app which will pick up the tokens from the hash
    return response
  }

  // No code or token found
  console.error('No authentication code or token found in callback')
  return NextResponse.redirect(`${origin}?error=missing_auth_data`)
}
