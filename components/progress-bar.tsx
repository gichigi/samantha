"use client"

import type React from "react"

interface ProgressBarProps {
  progress: number
  onSeek: (position: number) => void
}

export default function ProgressBar({ progress, onSeek }: ProgressBarProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const position = (e.clientX - rect.left) / rect.width
    onSeek(Math.max(0, Math.min(1, position)))
  }

  return (
    <div className="w-full bg-white/20 h-1 cursor-pointer absolute bottom-0 left-0 right-0" onClick={handleClick}>
      <div className="bg-white h-full transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
    </div>
  )
}
