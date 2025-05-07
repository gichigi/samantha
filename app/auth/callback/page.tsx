"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const code = searchParams.get('code')
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...')
  
  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return
    
    const handleCallback = async () => {
      setDebugInfo('Starting auth callback handling...')
      
      // Log URL information for debugging
      const fullUrl = window.location.href
      const hasHash = window.location.hash && window.location.hash.length > 0
      setDebugInfo(prev => prev + `\nFull URL: ${fullUrl}\nURL has hash: ${hasHash}`)
      
      // Check for error in query params
      if (error) {
        setDebugInfo(prev => prev + `\nFound error in URL: ${error}`)
        router.push(`/?error=${encodeURIComponent(error)}`)
        return
      }
      
      try {
        const supabase = createClient()
        setDebugInfo(prev => prev + '\nCreated Supabase client')
        
        // Handle code-based auth (authorization code flow)
        if (code) {
          setDebugInfo(prev => prev + `\nFound code in URL: ${code.substring(0, 5)}...`)
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            setDebugInfo(prev => prev + `\nError exchanging code: ${error.message}`)
            router.push(`/?error=${encodeURIComponent(error.message)}`)
            return
          }
          
          setDebugInfo(prev => prev + '\nSuccessfully exchanged code for session')
          router.push('/')
          return
        }
        
        // Check for hash-based auth
        if (hasHash) {
          setDebugInfo(prev => prev + `\nFound hash in URL: ${window.location.hash.substring(0, 15)}...`)
          
          // The hash is automatically processed by the Supabase client
          setTimeout(async () => {
            const { data, error: sessionError } = await supabase.auth.getSession()
            
            if (sessionError) {
              setDebugInfo(prev => prev + `\nError getting session: ${sessionError.message}`)
              router.push(`/?error=${encodeURIComponent(sessionError.message)}`)
              return
            }
            
            if (data?.session) {
              setDebugInfo(prev => prev + '\nFound session after hash processing')
              router.push('/')
              return
            } else {
              setDebugInfo(prev => prev + '\nNo session found after hash processing')
              router.push('/?error=no_session_after_hash')
            }
          }, 1000) // Give a second for hash processing
          
          return
        }
        
        // Check if we already have a session
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          setDebugInfo(prev => prev + `\nError checking existing session: ${sessionError.message}`)
        } else if (data?.session) {
          setDebugInfo(prev => prev + '\nFound existing session, redirecting')
          router.push('/')
          return
        } else {
          setDebugInfo(prev => prev + '\nNo existing session found')
        }
        
        // No code or token found
        setDebugInfo(prev => prev + '\nNo authentication code or token found in callback')
        router.push('/?error=missing_auth_data')
      } catch (e) {
        setDebugInfo(prev => prev + `\nUnexpected error: ${e instanceof Error ? e.message : String(e)}`)
        router.push('/?error=unexpected_error')
      }
    }
    
    handleCallback()
  }, [router, error, code])
  
  return (
    <div className="flex flex-col h-screen w-full items-center justify-center p-4">
      <div className="animate-pulse text-center mb-8">
        <h2 className="text-xl font-semibold mb-4">Completing login...</h2>
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Please wait while we authenticate you</p>
      </div>
      
      <div className="mt-8 w-full max-w-2xl">
        <details className="bg-gray-100 p-4 rounded">
          <summary className="font-medium cursor-pointer">Debug Information</summary>
          <pre className="mt-2 p-2 bg-gray-800 text-white text-xs overflow-auto rounded whitespace-pre-wrap">
            {debugInfo}
          </pre>
        </details>
      </div>
    </div>
  )
} 