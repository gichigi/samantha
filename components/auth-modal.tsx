"use client"

import { useState, useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { getSupabaseClient } from '@/lib/supabase'
import { X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isMounted, setIsMounted] = useState(false)
  
  // Only render on client-side to avoid hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null
  if (!isOpen) return null

  const supabase = getSupabaseClient()
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>
        
        <div className="mb-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Samantha</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Sign in to track your reading history</p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            style: {
              button: {
                borderRadius: '9999px',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontWeight: '500',
              },
              input: {
                borderRadius: '0.5rem',
              },
              anchor: {
                color: '#3b82f6',
              },
              message: {
                borderRadius: '0.5rem',
              }
            },
            variables: {
              default: {
                colors: {
                  brand: '#3b82f6',
                  brandAccent: '#2563eb',
                }
              }
            }
          }}
          providers={['google']}
          redirectTo={`${window.location.origin}/auth/callback`}
        />
      </div>
    </div>
  )
} 