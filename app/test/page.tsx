"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default function TestPage() {
  const router = useRouter()
  
  // Setup back button handler
  useEffect(() => {
    const setBackHandler = new CustomEvent('setBackHandler', { 
      detail: { handler: () => router.push('/') }
    });
    window.dispatchEvent(setBackHandler);
    
    return () => {
      const clearBackHandler = new CustomEvent('clearBackHandler');
      window.dispatchEvent(clearBackHandler);
    };
  }, [router]);

  const supabase = await createClient()
  
  // Test auth session
  const { data: { session } } = await supabase.auth.getSession()
  
  // Test reading_history table
  const { data: historyItems, error: historyError } = await supabase
    .from('reading_history')
    .select('*')
    .limit(5)

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

      <div className="mb-8">
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
    </div>
  )
}
