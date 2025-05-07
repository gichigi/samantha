"use client"

import { useState, useEffect } from "react"
import LoadingState from "@/components/loading-state"

interface LoadingViewProps {
  progress?: number
  message?: string
}

export default function LoadingView({ progress, message }: LoadingViewProps) {
  const [displayProgress, setDisplayProgress] = useState(progress || 0)

  // Simulate progress if none is provided
  useEffect(() => {
    if (progress !== undefined) {
      setDisplayProgress(progress)
      return
    }

    // Simulate progress
    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        // Slow down as we approach 100%
        const increment = prev < 50 ? 5 : prev < 80 ? 3 : 1
        const newProgress = Math.min(prev + increment, 95)
        return newProgress
      })
    }, 300)

    return () => clearInterval(interval)
  }, [progress])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#3b82f6] p-4">
      <LoadingState />
      {displayProgress > 0 && (
        <div className="mt-4 text-white/80">
          {displayProgress < 100 ? `Processing: ${displayProgress}%` : "Almost ready..."}
        </div>
      )}
      {message && <div className="mt-2 text-white/60">{message}</div>}
    </main>
  )
}
