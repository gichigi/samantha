"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"

type ReadingHistoryItem = {
  id: string
  user_id: string
  article_url: string
  title: string
  word_count: number
  created_at: string
}

type UsageStats = {
  limit: number
  used: number
  remaining: number
}

type ReadingHistoryResponse = {
  data: ReadingHistoryItem[]
  count: number
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  usage: UsageStats
}

export function useReadingHistory() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<ReadingHistoryItem[]>([])
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0,
    pages: 0,
  })
  const [usage, setUsage] = useState<UsageStats>({
    limit: 10000,
    used: 0,
    remaining: 10000,
  })

  const fetchHistory = async (page = 0, limit = 10) => {
    if (!user) {
      setError("User not authenticated")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/reading-history?page=${page}&limit=${limit}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch reading history")
      }

      const data: ReadingHistoryResponse = await response.json()

      setHistory(data.data)
      setPagination(data.pagination)
      setUsage(data.usage)
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching reading history")
    } finally {
      setIsLoading(false)
    }
  }

  const trackReading = async (articleUrl: string, title: string | null, wordCount: number) => {
    if (!user) {
      setError("User not authenticated")
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/reading-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleUrl,
          title,
          wordCount,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Special handling for quota exceeded
        if (response.status === 429) {
          setUsage({
            limit: errorData.limit,
            used: errorData.used,
            remaining: errorData.remaining,
          })
          throw new Error("Daily word limit exceeded")
        }

        throw new Error(errorData.error || "Failed to track reading")
      }

      // Refresh history after tracking
      await fetchHistory()
      return true
    } catch (err: any) {
      setError(err.message || "An error occurred while tracking reading")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    history,
    pagination,
    usage,
    isLoading,
    error,
    fetchHistory,
    trackReading,
  }
}
