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
      className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg p-4 transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
    >
      <div className="text-white mb-3 text-3xl">{icon}</div>
      <h3 className="font-semibold text-white text-sm mb-1">{title}</h3>
      <p className="text-white/70 text-xs font-normal">
        {wordCount} words · {readingTime} min
      </p>
    </button>
  )
}
