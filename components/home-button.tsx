"use client"

import { Home } from "lucide-react"

interface HomeButtonProps {
  onClick: () => void
}

export default function HomeButton({ onClick }: HomeButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
      aria-label="Go to home screen"
    >
      <Home size={24} />
    </button>
  )
}
