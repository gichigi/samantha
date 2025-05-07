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
  const [processComplete, setProcessComplete] = useState(false)
  const [success, setSuccess] = useState(false)
  
  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return
    
    const handleCallback = async () => {
      try {
        setDebugInfo('Starting auth callback handling...')
        
        // Log URL information for debugging
        const fullUrl = window.location.href
        const urlHash = window.location.hash
        const hasHash = urlHash && urlHash.length > 0
        
        setDebugInfo(prev => `${prev}\n\nFull URL: ${fullUrl}
URL has hash: ${hasHash}
Hash content: ${hasHash ? urlHash : 'none'}`
        )
        
        // Check for error in query params
        if (error) {
          setDebugInfo(prev => `${prev}\n\nFound error in URL: ${error}`)
          setProcessComplete(true)
          return
        }
        
        const supabase = createClient()
        setDebugInfo(prev => `${prev}\n\nCreated Supabase client`)
        
        // Handle code-based auth (authorization code flow)
        if (code) {
          setDebugInfo(prev => `${prev}\n\nFound code in URL: ${code.substring(0, 5)}...`)
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            setDebugInfo(prev => `${prev}\n\nError exchanging code: ${error.message}`)
            setProcessComplete(true)
            return
          }
          
          // Check if session was created
          const { data, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            setDebugInfo(prev => `${prev}\n\nError checking session after code: ${sessionError.message}`)
            setProcessComplete(true)
            return
          }
          
          if (data?.session) {
            setDebugInfo(prev => `${prev}\n\nSession successfully created with code!
User ID: ${data.session.user.id}
Email: ${data.session.user.email}`)
            setSuccess(true)
            setProcessComplete(true)
            return
          } else {
            setDebugInfo(prev => `${prev}\n\nCode was exchanged but no session was created.`)
            setProcessComplete(true)
            return
          }
        }
        
        // Check for hash-based auth
        if (hasHash) {
          // Print out hash details
          setDebugInfo(prev => `${prev}\n\nFound hash in URL: ${urlHash}`)
          
          // Manual hash processing
          setDebugInfo(prev => `${prev}\n\nAttempting to process hash data...`)
          
          // First try to manually parse the hash to see what's in it
          const hashParams = new URLSearchParams(urlHash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          setDebugInfo(prev => `${prev}\n\nHash contains:
access_token: ${accessToken ? '✓ present' : '✗ missing'}
refresh_token: ${refreshToken ? '✓ present' : '✗ missing'}`)
          
          // The hash should be automatically processed by Supabase
          // but let's check after a short delay to allow processing
          setDebugInfo(prev => `${prev}\n\nWaiting 3 seconds for Supabase to process hash...`)
          
          // Wait 3 seconds then check for session
          setTimeout(async () => {
            try {
              const { data, error: sessionError } = await supabase.auth.getSession()
              
              if (sessionError) {
                setDebugInfo(prev => `${prev}\n\nError getting session: ${sessionError.message}`)
                setProcessComplete(true)
                return
              }
              
              if (data?.session) {
                setDebugInfo(prev => `${prev}\n\nSuccess! Session found after hash processing.
User ID: ${data.session.user.id}
Email: ${data.session.user.email}`)
                setSuccess(true)
                setProcessComplete(true)
                return
              } else {
                // Try manual sign-in with the access token if present
                if (accessToken) {
                  setDebugInfo(prev => `${prev}\n\nNo session found. Attempting manual sign-in with token...`)
                  try {
                    const { error: signInError } = await supabase.auth.setSession({
                      access_token: accessToken,
                      refresh_token: refreshToken || '',
                    })
                    
                    if (signInError) {
                      setDebugInfo(prev => `${prev}\n\nError setting session manually: ${signInError.message}`)
                      setProcessComplete(true)
                      return
                    }
                    
                    // Check if we have a session now
                    const { data: finalData } = await supabase.auth.getSession()
                    if (finalData?.session) {
                      setDebugInfo(prev => `${prev}\n\nSuccess! Session created after manual setting.
User ID: ${finalData.session.user.id}
Email: ${finalData.session.user.email}`)
                      setSuccess(true)
                      setProcessComplete(true)
                      return
                    } else {
                      setDebugInfo(prev => `${prev}\n\nFailed to create session even after manual setting.`)
                      setProcessComplete(true)
                      return
                    }
                  } catch (e) {
                    setDebugInfo(prev => `${prev}\n\nException during manual sign-in: ${e instanceof Error ? e.message : String(e)}`)
                    setProcessComplete(true)
                    return
                  }
                } else {
                  setDebugInfo(prev => `${prev}\n\nNo session found after hash processing and no access token to try manual sign-in.`)
                  setProcessComplete(true)
                  return
                }
              }
            } catch (e) {
              setDebugInfo(prev => `${prev}\n\nException during session check: ${e instanceof Error ? e.message : String(e)}`)
              setProcessComplete(true)
            }
          }, 3000)
          
          return
        }
        
        // If we get here, we found neither code nor hash
        setDebugInfo(prev => `${prev}\n\nNo authentication code or hash found in URL.`)
        setProcessComplete(true)
      } catch (e) {
        setDebugInfo(prev => `${prev}\n\nUnexpected error: ${e instanceof Error ? e.message : String(e)}`)
        setProcessComplete(true)
      }
    }
    
    handleCallback()
  }, [router, error, code])
  
  // Handle redirect only after processing is complete
  useEffect(() => {
    if (processComplete) {
      // Wait 10 seconds to allow reading debug info before redirecting
      const timer = setTimeout(() => {
        if (success) {
          router.push('/')
        } else {
          router.push(`/?error=auth_failed&info=see_console_logs`)
        }
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [processComplete, success, router])
  
  return (
    <div className="flex flex-col h-screen w-full items-center justify-center p-4">
      <div className={`text-center mb-8 ${success ? 'text-green-600' : ''}`}>
        <h2 className="text-xl font-semibold mb-4">
          {!processComplete 
            ? 'Processing authentication...' 
            : success 
              ? '✅ Authentication successful!' 
              : '❌ Authentication failed'}
        </h2>
        {!processComplete && (
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        )}
        <p className="mt-4 text-gray-600">
          {processComplete 
            ? (success 
               ? 'Redirecting to the app in 10 seconds...' 
               : 'Redirecting back to login in 10 seconds...') 
            : 'Please wait while we authenticate you'}
        </p>
      </div>
      
      <div className="mt-4 w-full max-w-3xl">
        <details open className="bg-gray-100 p-4 rounded">
          <summary className="font-medium cursor-pointer">Debug Information</summary>
          <pre className="mt-2 p-2 bg-gray-800 text-white text-xs overflow-auto rounded whitespace-pre-wrap" style={{maxHeight: '60vh'}}>
            {debugInfo}
          </pre>
        </details>
      </div>
    </div>
  )
} 