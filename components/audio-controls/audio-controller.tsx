"use client"

import { useState } from "react"
import PlayButton from "@/components/play-button"
import ProgressBar from "@/components/progress-bar"
import TTSStatus from "./tts-status"

interface AudioControllerProps {
  isPlaying: boolean
  progress: number
  onTogglePlay: () => void
  onSeek: (position: number) => void
  onSkipForward?: () => void
  onSkipBackward?: () => void
  visible?: boolean
  error?: string | null
  voiceInfo?: {
    name: string | null
    locale: string | null
  } | null
  isSupported?: boolean
  autoplayBlocked?: boolean
  onRetry?: () => void
}

export default function AudioController({
  isPlaying,
  progress,
  onTogglePlay,
  onSeek,
  onSkipForward,
  onSkipBackward,
  visible = true,
  error = null,
  voiceInfo = null,
  isSupported = true,
  autoplayBlocked = false,
  onRetry,
}: AudioControllerProps) {
  // Only render the controller if it's meant to be visible
  if (!visible) return null

  return (
    <>
      {/* Status notifications */}
      <TTSStatus 
        error={error}
        voiceInfo={voiceInfo}
        isSupported={isSupported}
        autoplayBlocked={autoplayBlocked}
        onRetry={onRetry}
      />

      {/* Audio controls */}
    <div className="fixed bottom-0 left-0 right-0 z-20">
      {/* Control buttons */}
      <div className="flex justify-center items-center gap-6 pb-8 pt-4">
        {/* Skip backward button */}
        <button
          onClick={onSkipBackward}
          disabled={!isSupported || !!error}
          className="rounded-full bg-white/10 hover:bg-white/20 p-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Skip backward 10 seconds"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-white"
          >
            <polygon points="19,20 9,12 19,4 19,20"/>
            <polygon points="5,19 5,5"/>
          </svg>
        </button>

        {/* Play button */}
        <PlayButton 
          isPlaying={isPlaying} 
          onClick={onTogglePlay} 
          disabled={!isSupported || !!error}
        />

        {/* Skip forward button */}
        <button
          onClick={onSkipForward}
          disabled={!isSupported || !!error}
          className="rounded-full bg-white/10 hover:bg-white/20 p-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Skip forward 10 seconds"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-white"
          >
            <polygon points="5,4 15,12 5,20 5,4"/>
            <polygon points="19,5 19,19"/>
          </svg>
        </button>
      </div>

      {/* Progress bar at the very bottom */}
      <ProgressBar progress={progress} onSeek={onSeek} />
    </div>
    </>
  )
}
