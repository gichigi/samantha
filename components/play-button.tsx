"use client"

import { Play, Pause } from "lucide-react"

interface PlayButtonProps {
  isPlaying: boolean
  onClick: () => void
  disabled?: boolean
}

export default function PlayButton({ 
  isPlaying, 
  onClick, 
  disabled = false 
}: PlayButtonProps) {
  // Determine button styles based on state
  const buttonClasses = `
    w-16 h-16 flex items-center justify-center rounded-full 
    shadow-lg transition-all duration-200
    ${disabled 
      ? 'bg-gray-200 cursor-not-allowed opacity-60' 
      : 'bg-white hover:bg-blue-50 active:scale-95'
    }
  `

  return (
    <button
      onClick={(e) => {
        // Don't do anything if disabled
        if (disabled) return
        
        // Fix: Check if e exists before calling stopPropagation
        if (e) {
          e.stopPropagation()
        }
        onClick()
      }}
      className={buttonClasses}
      aria-label={isPlaying ? "Pause" : "Play"}
      disabled={disabled}
    >
      {isPlaying ? 
        <Pause size={28} className={disabled ? "text-gray-400" : "text-[#3b82f6]"} /> : 
        <Play size={28} className={`${disabled ? "text-gray-400" : "text-[#3b82f6]"} ml-1`} />
      }
    </button>
  )
}
