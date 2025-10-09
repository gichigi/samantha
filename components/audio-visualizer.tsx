"use client"

import { useEffect, useState } from "react"

interface AudioVisualizerProps {
  isLoading: boolean
  isPlaying: boolean
  audioDuration?: number
  currentTime?: number
}

export default function AudioVisualizer({ 
  isLoading, 
  isPlaying, 
  audioDuration = 0, 
  currentTime = 0 
}: AudioVisualizerProps) {
  const [animationPhase, setAnimationPhase] = useState(0)

  // Animation loop for loading and playing states
  useEffect(() => {
    if (!isLoading && !isPlaying) {
      setAnimationPhase(0)
      return
    }

    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 100)
    }, 50)

    return () => clearInterval(interval)
  }, [isLoading, isPlaying])

  // Calculate bar heights based on state
  const getBarHeight = (index: number, baseHeight: number) => {
    if (isLoading) {
      // Gentle pulsing during loading
      const pulse = Math.sin((animationPhase + index * 10) * 0.1) * 0.3 + 0.7
      return baseHeight * pulse
    }
    
    if (isPlaying && audioDuration > 0) {
      // Active animation during playback
      const progress = currentTime / audioDuration
      const barProgress = (index / 4) - progress
      const intensity = Math.max(0, 1 - Math.abs(barProgress) * 2)
      const wave = Math.sin((animationPhase + index * 15) * 0.2) * 0.4 + 0.6
      return baseHeight * intensity * wave
    }
    
    // Static when paused
    return baseHeight * 0.6
  }

  return (
    <div className="flex items-center justify-center h-64 w-80">
      <svg 
        viewBox="0 0 200 100" 
        className="w-full h-full text-white"
        aria-label={isLoading ? "Loading audio..." : isPlaying ? "Playing audio" : "Audio paused"}
      >
        {/* Bar 1 */}
        <rect 
          x="20" 
          y={50 - getBarHeight(0, 20)} 
          width="12" 
          height={getBarHeight(0, 20) * 2} 
          fill="currentColor" 
          rx="6"
        >
          {isLoading && (
            <animate 
              attributeName="height" 
              values={`${getBarHeight(0, 20) * 2};${getBarHeight(0, 20) * 2.5};${getBarHeight(0, 20) * 2}`} 
              dur="1.5s" 
              repeatCount="indefinite" 
            />
          )}
        </rect>

        {/* Bar 2 */}
        <rect 
          x="50" 
          y={50 - getBarHeight(1, 30)} 
          width="12" 
          height={getBarHeight(1, 30) * 2} 
          fill="currentColor" 
          rx="6"
        >
          {isLoading && (
            <animate 
              attributeName="height" 
              values={`${getBarHeight(1, 30) * 2};${getBarHeight(1, 30) * 2.3};${getBarHeight(1, 30) * 2}`} 
              dur="1.2s" 
              repeatCount="indefinite" 
            />
          )}
        </rect>

        {/* Bar 3 - Center bar (tallest) */}
        <rect 
          x="80" 
          y={50 - getBarHeight(2, 40)} 
          width="12" 
          height={getBarHeight(2, 40) * 2} 
          fill="currentColor" 
          rx="6"
        >
          {isLoading && (
            <animate 
              attributeName="height" 
              values={`${getBarHeight(2, 40) * 2};${getBarHeight(2, 40) * 2.4};${getBarHeight(2, 40) * 2}`} 
              dur="1s" 
              repeatCount="indefinite" 
            />
          )}
        </rect>

        {/* Bar 4 */}
        <rect 
          x="110" 
          y={50 - getBarHeight(3, 30)} 
          width="12" 
          height={getBarHeight(3, 30) * 2} 
          fill="currentColor" 
          rx="6"
        >
          {isLoading && (
            <animate 
              attributeName="height" 
              values={`${getBarHeight(3, 30) * 2};${getBarHeight(3, 30) * 2.3};${getBarHeight(3, 30) * 2}`} 
              dur="1.3s" 
              repeatCount="indefinite" 
            />
          )}
        </rect>

        {/* Bar 5 */}
        <rect 
          x="140" 
          y={50 - getBarHeight(4, 20)} 
          width="12" 
          height={getBarHeight(4, 20) * 2} 
          fill="currentColor" 
          rx="6"
        >
          {isLoading && (
            <animate 
              attributeName="height" 
              values={`${getBarHeight(4, 20) * 2};${getBarHeight(4, 20) * 2.5};${getBarHeight(4, 20) * 2}`} 
              dur="1.4s" 
              repeatCount="indefinite" 
            />
          )}
        </rect>
      </svg>
    </div>
  )
}
