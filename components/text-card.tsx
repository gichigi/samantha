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
      className="group flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-10 transition-all hover:bg-white/20 hover:scale-110 active:scale-95 w-[200px] h-[200px] md:w-[240px] md:h-[240px]"
      aria-label={`${title}: ${readingTime} minute read`}
      title={`${title}`}
    >
      <div className="text-white transition-transform group-hover:scale-110" style={{fontSize: '160px'}}>{icon}</div>
    </button>
  )
}
