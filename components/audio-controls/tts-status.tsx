"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Info, CheckCircle2 } from "lucide-react"

interface TTSStatusProps {
  error: string | null
  voiceInfo: {
    name: string | null
    locale: string | null
  } | null
  isSupported: boolean
  autoplayBlocked: boolean
  onRetry?: () => void
}

export default function TTSStatus({
  error,
  voiceInfo,
  isSupported,
  autoplayBlocked,
  onRetry,
}: TTSStatusProps) {
  const [visible, setVisible] = useState(false)
  const [dismissTimer, setDismissTimer] = useState<NodeJS.Timeout | null>(null)

  // Show the status message when props change
  useEffect(() => {
    if (error || autoplayBlocked || !isSupported) {
      setVisible(true)
      
      // Clear any existing timer
      if (dismissTimer) {
        clearTimeout(dismissTimer)
      }
      
      // For non-critical issues, auto-dismiss after 6 seconds
      if (!error && isSupported) {
        const timer = setTimeout(() => {
          setVisible(false)
        }, 6000)
        setDismissTimer(timer)
      }
    } else if (voiceInfo?.name) {
      // Show voice info briefly
      setVisible(true)
      
      // Clear any existing timer
      if (dismissTimer) {
        clearTimeout(dismissTimer)
      }
      
      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        setVisible(false)
      }, 3000)
      setDismissTimer(timer)
    }
    
    return () => {
      if (dismissTimer) {
        clearTimeout(dismissTimer)
      }
    }
  }, [error, voiceInfo, isSupported, autoplayBlocked])

  // Don't render anything if no message to show or component is hidden
  if (!visible) {
    return null
  }

  // Error message (highest priority)
  if (error) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-md shadow-md flex items-center max-w-md">
        <AlertCircle className="mr-2 h-5 w-5" />
        <span>{error}</span>
        <button 
          onClick={() => setVisible(false)}
          className="ml-4 text-white hover:text-red-100"
        >
          ✕
        </button>
      </div>
    )
  }

  // Feature not supported message
  if (!isSupported) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-white px-4 py-2 rounded-md shadow-md flex items-center max-w-md">
        <AlertCircle className="mr-2 h-5 w-5" />
        <span>Text-to-speech is not supported in this browser. Try Chrome, Edge, or Safari.</span>
        <button 
          onClick={() => setVisible(false)}
          className="ml-4 text-white hover:text-yellow-100"
        >
          ✕
        </button>
      </div>
    )
  }

  // Autoplay blocked message
  if (autoplayBlocked) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-md shadow-md flex items-center max-w-md">
        <Info className="mr-2 h-5 w-5" />
        <span>
          Audio autoplay was blocked. Click the play button to start.
        </span>
        {onRetry && (
          <button 
            onClick={() => {
              onRetry()
              setVisible(false)
            }}
            className="ml-4 bg-white text-blue-500 px-2 py-1 rounded text-sm"
          >
            Play
          </button>
        )}
        <button 
          onClick={() => setVisible(false)}
          className="ml-4 text-white hover:text-blue-100"
        >
          ✕
        </button>
      </div>
    )
  }

  // Voice info message (lowest priority)
  if (voiceInfo?.name) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-md shadow-md flex items-center max-w-md opacity-90">
        <CheckCircle2 className="mr-2 h-5 w-5" />
        <span>
          Using voice: {voiceInfo.name}
          {voiceInfo.locale && <span className="text-sm ml-1">({voiceInfo.locale})</span>}
        </span>
      </div>
    )
  }

  return null
} 