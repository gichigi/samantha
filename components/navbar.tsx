"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { History, ChevronLeft, User, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const { user, signOut, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isHomePage = pathname === "/"
  const [isMounted, setIsMounted] = useState(false)
  const [backHandler, setBackHandler] = useState<(() => void) | null>(null)
  const [usageInfo, setUsageInfo] = useState<any>(null)
  
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
  
  // Fetch usage info when user is authenticated
  useEffect(() => {
    const fetchUsage = async () => {
      if (user) {
        try {
          const response = await fetch('/api/usage-status')
          if (response.ok) {
            const usage = await response.json()
            setUsageInfo(usage)
          }
        } catch (error) {
          console.error('Error fetching usage:', error)
        }
      } else {
        setUsageInfo(null)
      }
    }
    
    fetchUsage()
  }, [user])

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
          {user ? (
            <>
              <Link 
                href="/history" 
                className="flex items-center px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white/90 text-sm font-medium"
              >
                <History size={16} className="mr-1.5" />
                <span>History</span>
              </Link>
              
              {usageInfo && (
                <div className="text-white/80 text-sm">
                  {usageInfo.remaining}/{usageInfo.limit} articles left
                </div>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <User size={16} className="mr-2" />
                    {user.email?.split('@')[0] || 'Account'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-white border border-gray-200 shadow-lg rounded-md p-1">
                  <DropdownMenuItem 
                    onClick={() => signOut()} 
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-sm cursor-pointer transition-colors"
                  >
                    <LogOut size={16} className="mr-2 text-gray-500" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/10"
              onClick={() => {
                router.push('/')
                // Trigger auth prompt
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('trigger-auth-prompt'))
                }, 100)
              }}
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
} 