"use client"

import { ChevronLeft } from "lucide-react"

interface HeaderProps {
  title: string
  onBackClick: () => void
}

export default function Header({ title, onBackClick }: HeaderProps) {
  return (
    <div className="flex items-center justify-center py-4 px-6">
      <button
        onClick={onBackClick}
        className="absolute left-4 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
        aria-label="Go back"
      >
        <ChevronLeft size={24} className="text-white" />
      </button>
      
      {title && (
      <div className="text-center max-w-[70%] mx-auto">
        <h1 className="text-lg font-semibold text-white truncate">{title}</h1>
      </div>
      )}
    </div>
  )
}
