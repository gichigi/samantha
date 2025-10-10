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
      className="group relative flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-2xl p-1 md:p-2 transition-all hover:bg-white/20 hover:scale-105 active:scale-95 w-full aspect-[3/2] md:aspect-[4/3] lg:aspect-square"
      aria-label={`${title}: ${readingTime} minute read`}
      title={`${title}`}
    >
      {/* Time badge in top right */}
      <div className="absolute top-2 right-2 md:top-3 md:right-3 px-2 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
        {readingTime}m
      </div>
      
      {/* Center icon - responsive sizing */}
      <div className="text-white transition-transform group-hover:scale-110">{icon}</div>
    </button>
  )
}


