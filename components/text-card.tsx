"use client"

import type { ReactNode } from "react"

interface TextCardProps {
  title: string
  icon: ReactNode
  wordCount: number
  readingTime: number
  onClick: () => void
}

export default function TextCard({ title, icon, wordCount, readingTime, onClick }: TextCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 transition-all hover:bg-white/20 hover:scale-105 active:scale-95 aspect-square w-full"
      aria-label={`${title}: ${readingTime} minute read`}
      title={`${title}`}
    >
      {/* Time badge in top right */}
      <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
        {readingTime}m
      </div>
      
      {/* Center icon */}
      <div className="text-white transition-transform group-hover:scale-110" style={{fontSize: '80px'}}>{icon}</div>
    </button>
  )
}


