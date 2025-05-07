"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import AuthModal from "@/components/auth-modal"
import { LogOut, LogIn } from "lucide-react"

export default function LoginButton() {
  const { user, signOut, isLoading } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  if (isLoading) {
    return (
      <button className="px-4 py-2 bg-white/10 rounded-md text-white/80" disabled>
        <span className="flex items-center justify-center w-5 h-5 mx-auto">
          <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      </button>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden md:block text-sm text-white/90">
          <span className="font-medium">{user.user_metadata.full_name || user.email}</span>
        </div>
        <button 
          onClick={signOut} 
          className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white/90 rounded-md text-sm font-medium transition-colors"
        >
          <LogOut size={16} className="mr-1.5" />
          <span>Sign out</span>
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsAuthModalOpen(true)}
        className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white/90 rounded-md text-sm font-medium transition-colors"
      >
        <LogIn size={16} className="mr-1.5" />
        <span>Sign in</span>
      </button>
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  )
}
