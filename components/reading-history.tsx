"use client"

import { useState, useEffect } from "react"
import { Clock, FileText, Trash2 } from "lucide-react"
import Link from "next/link"
import { LocalHistoryService, type HistoryItem } from "@/services/local-history-service"

export default function ReadingHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load history from localStorage
    const loadHistory = () => {
      const items = LocalHistoryService.getHistory()
      setHistory(items)
      setIsLoading(false)
    }
    
    loadHistory()
  }, [])

  const handleDelete = (id: string) => {
    LocalHistoryService.removeItem(id)
    setHistory(prev => prev.filter(item => item.id !== id))
  }

  const handleClearAll = () => {
    if (confirm('Clear all reading history?')) {
      LocalHistoryService.clearHistory()
      setHistory([])
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Clear all button */}
      {history.length > 0 && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleClearAll}
            className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
            aria-label="Clear all history"
          >
            <Trash2 size={16} className="mr-2" />
            Clear All
          </button>
        </div>
      )}

      {/* History list */}
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white/10 rounded-lg">
          <div className="bg-white/20 rounded-full p-4 mb-4">
            <FileText size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No reading history yet</h2>
          <p className="text-white/80 mb-6">Articles you read will appear here</p>
          <Link 
            href="/"
            className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-md transition-colors"
          >
            ← Home
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div 
              key={item.id} 
              className="border border-white/20 rounded-lg p-6 bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-lg text-white mb-2">{item.title || "Untitled Article"}</h3>
                  <div className="text-sm text-white/70 truncate mb-3">{item.url}</div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
                    <div className="flex items-center" aria-label={`${item.wordCount} words`}>
                      <FileText size={16} className="mr-1.5" />
                      <span>{item.wordCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center" aria-label={`Read on ${new Date(item.createdAt).toLocaleString()}`}>
                      <Clock size={16} className="mr-1.5" />
                      <span>{new Date(item.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="ml-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                  aria-label="Delete this history item"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
