"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { History, ChevronLeft } from "lucide-react"
import LoginButton from "@/components/login-button"
import { useAuth } from "@/contexts/auth-context"

export default function Navbar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isHomePage = pathname === "/"
  const [isMounted, setIsMounted] = useState(false)
  const [backHandler, setBackHandler] = useState<(() => void) | null>(null)
  
  // Only show back button when not on home page
  const showBackButton = !isHomePage
  
  // Default back handler uses router
  const defaultBackHandler = useCallback(() => {
    router.back()
  }, [router])
  
  // Handle back button click
  const handleBackClick = useCallback(() => {
    if (backHandler) {
      backHandler()
    } else {
      defaultBackHandler()
    }
  }, [backHandler, defaultBackHandler])
  
  // Listen for back handler events
  useEffect(() => {
    const handleSetBackHandler = (e: CustomEvent) => {
      setBackHandler(() => e.detail.handler)
    }
    
    const handleClearBackHandler = () => {
      setBackHandler(null)
    }
    
    window.addEventListener('setBackHandler', handleSetBackHandler as EventListener)
    window.addEventListener('clearBackHandler', handleClearBackHandler)
    
    return () => {
      window.removeEventListener('setBackHandler', handleSetBackHandler as EventListener)
      window.removeEventListener('clearBackHandler', handleClearBackHandler)
    }
  }, [])
  
  // Handle client-side rendering to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  if (!isMounted) {
    return <div className="h-16 bg-blue-600"></div>
  }

  return (
    <nav className="bg-blue-600 text-white py-4 px-6 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <button
              onClick={handleBackClick}
              className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <Link 
              href="/history" 
              className="flex items-center px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white/90 text-sm font-medium"
            >
              <History size={16} className="mr-1.5" />
              <span>History</span>
            </Link>
          )}
          <LoginButton />
        </div>
      </div>
    </nav>
  )
} 