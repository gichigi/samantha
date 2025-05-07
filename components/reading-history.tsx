"use client"

import { useEffect } from "react"
import { useReadingHistory } from "@/hooks/use-reading-history"
import { useAuth } from "@/contexts/auth-context"
import LoadingState from "@/components/loading-state"
import { ArrowLeft, Clock, FileText } from "lucide-react"
import Link from "next/link"

// Skeleton loader for history items
function HistoryItemSkeleton() {
  return (
    <div className="border rounded-lg p-6 bg-white/80 shadow-sm animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-4 bg-gray-200 rounded w-40"></div>
      </div>
    </div>
  )
}

export default function ReadingHistory() {
  const { user, isLoading: authLoading } = useAuth()
  const { history, pagination, usage, isLoading, error, fetchHistory } = useReadingHistory()

  useEffect(() => {
    if (user && !authLoading) {
      fetchHistory()
    }
  }, [user, authLoading])

  // DEBUG: Check auth storage
  useEffect(() => {
    console.log("AUTH DEBUG - Current user from context:", user);
    
    // Check localStorage for auth tokens
    const localStorageKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('auth')) {
        localStorageKeys.push({
          key,
          // Only log that it exists rather than the actual token for security
          hasValue: !!localStorage.getItem(key)
        });
      }
    }
    console.log("AUTH DEBUG - Auth-related localStorage keys:", localStorageKeys);
    
    // Check cookies
    console.log("AUTH DEBUG - All cookies:", document.cookie);
    
    // Look specifically for supabase cookies
    const allCookies = document.cookie.split(';');
    const supaCookies = allCookies.filter(c => c.trim().toLowerCase().includes('supabase') || c.trim().toLowerCase().includes('sb-'));
    console.log("AUTH DEBUG - Supabase cookies:", supaCookies);
    
  }, [user]);

  // Show loading state with skeleton for authenticated users
  if (user && isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        {/* Usage stats skeleton */}
        <div className="mb-8 p-6 bg-blue-50/50 rounded-lg shadow-sm animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        
        {/* History items skeletons */}
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <HistoryItemSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  // Show general loading state for unauthenticated users or during auth check
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <LoadingState />
        <p className="mt-4 text-blue-600 font-medium">Loading your reading history...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="bg-blue-100 rounded-full p-4 mb-4">
          <FileText size={32} className="text-blue-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">Sign in to view your history</h2>
        <p className="text-gray-600 mb-6">Please sign in to track and view your reading history.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="bg-red-100 rounded-full p-4 mb-4">
          <FileText size={32} className="text-red-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={() => fetchHistory()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Usage stats */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-sm">
        <h3 className="font-semibold mb-2">Today's Usage</h3>
        <div className="flex items-center mb-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {usage.used.toLocaleString()} / {usage.limit.toLocaleString()} words used ({usage.remaining.toLocaleString()}{" "}
          remaining)
        </div>
      </div>

      {/* History list */}
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-lg shadow-sm">
          <div className="bg-blue-100 rounded-full p-4 mb-4">
            <FileText size={32} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">No reading history yet</h2>
          <p className="text-gray-600 mb-6">You haven't read any articles yet. Head back to the homepage to get started.</p>
          <Link 
            href="/"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Homepage
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors shadow-sm bg-white">
              <h3 className="font-medium text-lg text-blue-800">{item.title || "Untitled Article"}</h3>
              <div className="text-sm text-blue-600 truncate mb-3">{item.article_url}</div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <FileText size={16} className="mr-1.5" />
                  <span>{item.word_count.toLocaleString()} words</span>
                </div>
                <div className="flex items-center">
                  <Clock size={16} className="mr-1.5" />
                  <span>{new Date(item.created_at).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => fetchHistory(Math.max(0, pagination.page - 1))}
            disabled={pagination.page === 0}
            className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors bg-white"
          >
            Previous
          </button>
          <span className="px-4 py-2 bg-white rounded-md border">
            Page {pagination.page + 1} of {pagination.pages}
          </span>
          <button
            onClick={() => fetchHistory(Math.min(pagination.pages - 1, pagination.page + 1))}
            disabled={pagination.page === pagination.pages - 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors bg-white"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
