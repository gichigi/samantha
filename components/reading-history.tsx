"use client"

import { useEffect } from "react"
import { useReadingHistory } from "@/hooks/use-reading-history"
import { useAuth } from "@/contexts/auth-context"

export default function ReadingHistory() {
  const { user, isLoading: authLoading } = useAuth()
  const { history, pagination, usage, isLoading, error, fetchHistory } = useReadingHistory()

  useEffect(() => {
    if (user && !authLoading) {
      fetchHistory()
    }
  }, [user, authLoading])

  if (authLoading) {
    return <div className="p-4 text-center">Loading authentication...</div>
  }

  if (!user) {
    return <div className="p-4 text-center">Please sign in to view your reading history.</div>
  }

  if (isLoading) {
    return <div className="p-4 text-center">Loading reading history...</div>
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Your Reading History</h2>

      {/* Usage stats */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Today's Usage</h3>
        <div className="flex items-center mb-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
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
        <div className="text-center py-8 text-gray-500">You haven't read any articles yet.</div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <h3 className="font-medium">{item.title || "Untitled Article"}</h3>
              <div className="text-sm text-blue-600 truncate">{item.article_url}</div>
              <div className="mt-2 flex justify-between text-sm text-gray-500">
                <span>{item.word_count.toLocaleString()} words</span>
                <span>{new Date(item.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button
            onClick={() => fetchHistory(Math.max(0, pagination.page - 1))}
            disabled={pagination.page === 0}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {pagination.page + 1} of {pagination.pages}
          </span>
          <button
            onClick={() => fetchHistory(Math.min(pagination.pages - 1, pagination.page + 1))}
            disabled={pagination.page === pagination.pages - 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
