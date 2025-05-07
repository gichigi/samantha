'use client'
import { useState } from 'react'
import { createSupabaseClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface LogoutButtonProps {
  className?: string
}

export default function LogoutButton({ className = '' }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const handleLogout = async () => {
    setLoading(true)
    
    try {
      const supabase = createSupabaseClient()
      await supabase.auth.signOut()
      router.refresh()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 ${className}`}
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </button>
  )
} 