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
        {/* Play button */}
        <div className="flex justify-center pb-8 pt-4">
          <PlayButton 
            isPlaying={isPlaying} 
            onClick={onTogglePlay} 
            disabled={!isSupported || !!error}
          />
        </div>

        {/* Progress bar at the very bottom */}
        <ProgressBar progress={progress} onSeek={onSeek} />
      </div>
    </>
  )
}
