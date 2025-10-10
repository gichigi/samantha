"use client"

import type React from "react"

import { useState } from "react"
import { Globe, AlertCircle } from "lucide-react"
import { validateUrl } from "@/utils/url-validation"

interface UrlInputProps {
  onSubmit: (url: string) => void
  isLoading: boolean
}

export default function UrlInput({ onSubmit, isLoading, darkMode = true }: UrlInputProps & { darkMode?: boolean }) {
  const [url, setUrl] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate the URL using shared validation utility
    const validation = validateUrl(url.trim())
    if (!validation.isValid) {
      // Set error message from validation result
      const errorMsg = validation.error?.message || "Invalid URL"
      setValidationError(errorMsg)
      console.error("URL validation failed:", validation.error?.code, errorMsg)
      return
    }

    // Clear any previous errors and submit
    setValidationError(null)
    onSubmit(url.trim())
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null)
    }
  }

  return (
    <div className="w-full mt-2">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative flex items-center overflow-hidden rounded-full bg-white/10 backdrop-blur-sm transition-all hover:bg-white/15">
          <div className="absolute left-4 text-white/70">
            <Globe size={18} />
          </div>
          <input
            type="text"
            value={url}
            onChange={handleUrlChange}
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
      
      {/* Error message display */}
      {validationError && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-300">
          <AlertCircle size={16} />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  )
}
