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
      className="flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-lg p-8 transition-all hover:bg-white/20 hover:scale-105 active:scale-95 min-h-[120px]"
      aria-label={`${title}: ${readingTime} minute read`}
      title={`${title}`}
    >
      <div className="text-white text-8xl" style={{fontSize: '96px'}}>{icon}</div>
    </button>
  )
}
