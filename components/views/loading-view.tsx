"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import AudioVisualizer from "@/components/audio-visualizer"
import { useReader } from "@/contexts/reader-context"
import { useViewState } from "@/hooks/use-view-state"
import { useTextProcessing } from "@/hooks/use-text-processing"

interface LoadingViewProps {
  progress?: number
  message?: string
}

export default function LoadingView({ progress, message }: LoadingViewProps) {
  const [displayProgress, setDisplayProgress] = useState(progress || 0)
  const { currentText, audioUrl, setAudioUrl } = useReader()
  const { transitionTo } = useViewState()
  const processingStartedRef = useRef(false)
  
  // Stable callback that won't change on re-renders
  const handleAudioReady = useCallback((url: string) => {
    setAudioUrl(url)
    
    // Transition to reader view
    setTimeout(() => {
      transitionTo("reading")
    }, 500)
  }, [setAudioUrl, transitionTo])
  
  // Initialize text processing hook with stable callback
  const { processText } = useTextProcessing({
    onAudioReady: handleAudioReady
  })

  // Generate audio ONCE when we have text and no audio
  useEffect(() => {
    // Only process if we have text, no audio, and haven't started yet
    if (currentText && !audioUrl && !processingStartedRef.current) {
      processingStartedRef.current = true
      
      processText(currentText).catch((error) => {
        console.error("Audio generation failed:", error)
        processingStartedRef.current = false
      })
    }
  }, [currentText, audioUrl]) // Only depend on currentText and audioUrl

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
      {/* Animated soundwave for loading */}
      <div className="mb-8">
        <AudioVisualizer
          isLoading={true}
          isPlaying={false}
          audioDuration={0}
          currentTime={0}
        />
      </div>
      
      {/* Progress indicator - prominent */}
      {displayProgress > 0 && (
        <div className="mt-4 text-white text-4xl font-light">
          {displayProgress < 100 ? `${displayProgress}%` : "Ready"}
        </div>
      )}
    </main>
  )
}
