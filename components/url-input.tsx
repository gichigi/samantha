"use client"

import type React from "react"

import { useState } from "react"
import { Globe } from "lucide-react"

interface UrlInputProps {
  onSubmit: (url: string) => void
  isLoading: boolean
}

export default function UrlInput({ onSubmit, isLoading, darkMode = true }: UrlInputProps & { darkMode?: boolean }) {
  const [url, setUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onSubmit(url.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full mt-2">
      <div className="relative flex items-center overflow-hidden rounded-full bg-white/10 backdrop-blur-sm transition-all hover:bg-white/15">
        <div className="absolute left-4 text-white/70">
          <Globe size={18} />
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a URL to read..."
          className="w-full bg-transparent py-3 pl-12 pr-24 text-white placeholder-white/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/30 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-1">
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading</span>
            </span>
          ) : (
            "Extract"
          )}
        </button>
      </div>
    </form>
  )
}
