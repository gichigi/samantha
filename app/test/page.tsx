"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function TestPage() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [historyItems, setHistoryItems] = useState([])
  const [historyError, setHistoryError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Setup back button handler
  useEffect(() => {
    const setBackHandler = new CustomEvent('setBackHandler', { 
      detail: { handler: () => router.push('/') }
    })
    window.dispatchEvent(setBackHandler)
    
    return () => {
      const clearBackHandler = new CustomEvent('clearBackHandler')
      window.dispatchEvent(clearBackHandler)
    }
  }, [router])

  // Fetch Supabase data
  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        
        // Get session
        const { data: sessionData } = await supabase.auth.getSession()
        setSession(sessionData.session)
        
        // Get reading history
        if (sessionData.session) {
          const { data, error } = await supabase
            .from('reading_history')
            .select('*')
            .limit(5)
            
          setHistoryItems(data || [])
          setHistoryError(error)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Supabase Connection Test</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">TTS Test</h2>
        <p>This page is used for testing text-to-speech functionality.</p>
      </div>
      
      <button
        onClick={() => router.push('/')} 
        className="px-4 py-2 bg-blue-600 text-white rounded-md"
      >
        Return to Home
      </button>

      {isLoading ? (
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <div className="mb-8 mt-8">
            <h2 className="text-xl font-semibold mb-2">Auth Status</h2>
            <div className="p-4 bg-gray-100 rounded">
              {session ? (
                <p className="text-green-600">✅ Authenticated as {session.user.email}</p>
              ) : (
                <p className="text-red-600">❌ Not authenticated</p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Reading History Test</h2>
            <div className="p-4 bg-gray-100 rounded">
              {historyError ? (
                <p className="text-red-600">❌ Error: {historyError.message}</p>
              ) : (
                <>
                  <p className="text-green-600 mb-2">✅ Successfully connected to reading_history table</p>
                  <p>Found {historyItems?.length || 0} items</p>
                </>
              )}
            </div>
          </div>
          
          <pre className="bg-gray-800 text-white p-4 rounded overflow-auto">
            {JSON.stringify({ session: !!session, historyItems }, null, 2)}
          </pre>
        </>
      )}
    </div>
  )
}
