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
  const [error, setError] = useState<string | null>(null)
  const { currentText, currentTitle, audioUrl, setAudioUrl } = useReader()
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
  
  // Handle real progress updates from TTS service
  const handleProgressUpdate = useCallback((progress: number) => {
    console.log(`Processing progress: ${progress}%`)
    setDisplayProgress(progress)
  }, [])
  
  // Initialize text processing hook with stable callbacks INCLUDING progress
  const { processText } = useTextProcessing({
    onAudioReady: handleAudioReady,
    onProgressUpdate: handleProgressUpdate,
    onError: (errorMsg: string) => {
      console.error("Audio generation error:", errorMsg)
      setError(errorMsg.includes("server error") 
        ? "OpenAI is having issues. Try again in a moment." 
        : "Failed to generate audio. Please try again.")
      
      // Go back to home after showing error briefly
      setTimeout(() => {
        transitionTo("home")
      }, 3000)
    }
  })

  // Generate audio ONCE when we have text and no audio
  useEffect(() => {
    // Only process if we have text, no audio, and haven't started yet
    if (currentText && !audioUrl && !processingStartedRef.current) {
      processingStartedRef.current = true
      
      // Show initial progress immediately
      setDisplayProgress(10)
      
      processText(currentText, currentTitle).catch((error) => {
        console.error("Audio generation failed:", error)
        processingStartedRef.current = false
      })
    }
  }, [currentText, audioUrl]) // Don't include processText to avoid re-renders

  // Use provided progress prop if available (for external control)
  useEffect(() => {
    if (progress !== undefined) {
      setDisplayProgress(progress)
    }
  }, [progress])

  // Determine current stage based on progress
  const getStage = (progress: number) => {
    if (progress < 30) return 'extracting'
    if (progress < 60) return 'preprocessing'
    if (progress < 90) return 'generating'
    return 'ready'
  }

  const currentStage = getStage(displayProgress)

  // Helper to get icon state
  const getIconState = (stageName: string, threshold: number) => {
    const isActive = currentStage === stageName
    const isCompleted = displayProgress >= threshold
    
    if (isActive) return 'active'
    if (isCompleted) return 'completed'
    return 'upcoming'
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#3b82f6] p-4">
      {/* Article title */}
      {currentTitle && (
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {currentTitle}
          </h1>
        </div>
      )}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .pulse-active {
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes breathe-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
        
        @keyframes glow {
          0%, 100% {
            filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 40px rgba(255, 255, 255, 0.6));
          }
        }
      `}</style>
      
      {/* Breathing circle for loading */}
      <div>
        <div className="flex items-center justify-center h-48">
          <div 
            className="relative"
            style={{ animation: 'breathe-slow 4s ease-in-out infinite' }}
          >
            <div 
              className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40"
              style={{ animation: 'glow 4s ease-in-out infinite' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-sm" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Error message if something went wrong */}
      {error ? (
        <div className="mt-4 text-white text-center max-w-md">
          <p className="text-lg font-light">{error}</p>
          <p className="text-sm opacity-70 mt-2">Returning to home...</p>
        </div>
      ) : (
        /* Stage icons with elegant transitions */
        <div className="mt-4 flex gap-8 items-center">
        {/* Extracting stage */}
        <div className={`transition-all duration-500 ${
          getIconState('extracting', 30) === 'active' ? 'opacity-100 scale-110 pulse-active' : 
          getIconState('extracting', 30) === 'completed' ? 'opacity-100 scale-100' : 
          'opacity-30 scale-90'
        }`}>
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Document */}
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            {/* Magnifying glass overlay */}
            <circle cx="18" cy="6" r="3"/>
            <path d="m20.5 8.5-1.5 1.5"/>
          </svg>
        </div>

        {/* Preprocessing stage */}
        <div className={`transition-all duration-500 ${
          getIconState('preprocessing', 60) === 'active' ? 'opacity-100 scale-110 pulse-active' : 
          getIconState('preprocessing', 60) === 'completed' ? 'opacity-100 scale-100' : 
          'opacity-30 scale-90'
        }`}>
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </div>

        {/* Generating stage */}
        <div className={`transition-all duration-500 ${
          getIconState('generating', 90) === 'active' ? 'opacity-100 scale-110 pulse-active' : 
          getIconState('generating', 90) === 'completed' ? 'opacity-100 scale-100' : 
          'opacity-30 scale-90'
        }`}>
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
        </div>

        {/* Ready stage */}
        <div className={`transition-all duration-500 ${
          getIconState('ready', 100) === 'active' ? 'opacity-100 scale-110 pulse-active' : 
          getIconState('ready', 100) === 'completed' ? 'opacity-100 scale-100' : 
          'opacity-30 scale-90'
        }`}>
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>
      )}
    </main>
  )
}
