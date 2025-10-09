"use client"

import { useState, useEffect } from "react"
import { BookOpen, Brain, Sparkles, History, Globe } from "lucide-react"
import TextCard from "@/components/text-card"
import { sampleTexts } from "@/data/sample-texts"
import { useReader } from "@/contexts/reader-context"
import { useUrlExtraction } from "@/hooks/use-url-extraction"
import { useViewState } from "@/hooks/use-view-state"
import { LocalUsageService } from "@/services/local-usage-service"

export default function HomeView() {
  const {
    setCurrentTextIndex,
    setCurrentTitle,
    setCurrentUrl,
    setUseTimestampHighlighting,
    setAudioUrl,
    setCurrentText,
  } = useReader()

  const { transitionTo } = useViewState()
  const { isLoading, extractUrl, error: extractionError } = useUrlExtraction()
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  // Handle sample article selection with on-demand TTS generation
  const handleSelectSampleText = async (index: number) => {
    // Set the current text content
    setCurrentText(sampleTexts[index].content)
    setCurrentTextIndex(index)
    setCurrentTitle(sampleTexts[index].title)
    setUseTimestampHighlighting(false)
    
    // Clear any previous audio URL to force TTS generation
    setAudioUrl(null)

    // Show loading screen - it will automatically transition when audio is ready
    transitionTo("loading")
  }

  const validateUrl = (url: string): { isValid: boolean; error?: string } => {
    try {
      const urlObj = new URL(url)
      
      // Check for PDF files
      const pathname = urlObj.pathname.toLowerCase()
      if (pathname.endsWith('.pdf')) {
        return {
          isValid: false,
          error: "Can't read PDF files. Try a web article URL instead."
        }
      }

      // Check for other unsupported file types
      const unsupportedExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar']
      if (unsupportedExtensions.some(ext => pathname.endsWith(ext))) {
        return {
          isValid: false,
          error: "Can't read document files. Please paste a web article URL."
        }
      }

      // Check for reasonable protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
          isValid: false,
          error: "Please use a complete web address (like https://example.com)."
        }
      }

      return { isValid: true }
    } catch {
      return {
        isValid: false,
        error: "Please enter a complete web address (like https://example.com/article)"
      }
    }
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) {
      setValidationError("Please paste a web article URL")
      return
    }

    // Validate URL format
    const validation = validateUrl(url.trim())
    if (!validation.isValid) {
      setValidationError(validation.error || "Invalid URL")
      return
    }

    // Check daily limit
    const canExtract = LocalUsageService.canExtract()
    if (!canExtract) {
      const usage = LocalUsageService.getUsage()
      const resetTime = new Date(usage.resetDate).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      })
      setError(`Daily limit reached (${usage.limit} articles). Resets at ${resetTime}`)
      return
    }

    setValidationError(null)
    setError(null)
    transitionTo("loading")

    const extractedData = await extractUrl(url.trim())

    if (extractedData) {
      // Increment usage count
      LocalUsageService.incrementUsage()
      
      // Dispatch event to update navbar
      window.dispatchEvent(new CustomEvent('usage-updated'))
      
      setCurrentTitle(extractedData.title)
      setCurrentUrl(url.trim())
      setCurrentText(extractedData.content)
      setUseTimestampHighlighting(false)
      setAudioUrl(null) // Use TTS generation

      transitionTo("reading")
    } else {
      // Handle extraction errors
      if (extractionError) {
        if (extractionError.code === "USAGE_LIMIT_EXCEEDED") {
          setError(`Daily limit reached! ${extractionError.suggestion}`)
        } else if (extractionError.code === "UNSUPPORTED_FILE_TYPE") {
          setError("Can't read this file type. Try a web article URL instead.")
        } else if (extractionError.code === "CONTENT_TOO_LONG") {
          setError("This article is too long. Try a shorter article (under 10,000 words).")
        } else if (extractionError.code === "INVALID_URL") {
          setError("Invalid URL. Please paste a complete web address.")
        } else {
          setError("Couldn't extract this content. Please try a different article URL.")
        }
      }
      
      transitionTo("home")
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    if (validationError || error) {
      setValidationError(null)
      setError(null)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#3b82f6] p-6">
      {/* Balanced Title with Samantha */}
      <div className="flex flex-col items-center mb-12">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-light text-white mb-8 tracking-wide">
          Samantha
        </h1>
        <div className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center">
          {/* Audio wave icon representing Samantha */}
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            className="w-full h-full text-white"
            aria-label="She reads the internet, out loud, just for you"
          >
            <rect x="3" y="10" width="2" height="4" fill="currentColor" rx="1">
              <animate attributeName="height" values="4;12;4" dur="1s" repeatCount="indefinite" />
              <animate attributeName="y" values="10;6;10" dur="1s" repeatCount="indefinite" />
            </rect>
            <rect x="7" y="8" width="2" height="8" fill="currentColor" rx="1">
              <animate attributeName="height" values="8;16;8" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="y" values="8;4;8" dur="1.2s" repeatCount="indefinite" />
            </rect>
            <rect x="11" y="6" width="2" height="12" fill="currentColor" rx="1">
              <animate attributeName="height" values="12;18;12" dur="0.9s" repeatCount="indefinite" />
              <animate attributeName="y" values="6;3;6" dur="0.9s" repeatCount="indefinite" />
            </rect>
            <rect x="15" y="8" width="2" height="8" fill="currentColor" rx="1">
              <animate attributeName="height" values="8;14;8" dur="1.1s" repeatCount="indefinite" />
              <animate attributeName="y" values="8;5;8" dur="1.1s" repeatCount="indefinite" />
            </rect>
            <rect x="19" y="10" width="2" height="4" fill="currentColor" rx="1">
              <animate attributeName="height" values="4;10;4" dur="1.3s" repeatCount="indefinite" />
              <animate attributeName="y" values="10;7;10" dur="1.3s" repeatCount="indefinite" />
            </rect>
          </svg>
        </div>
      </div>

      {/* Error message display */}
      {(error || validationError) && (
        <div 
          className="bg-red-500/20 p-4 rounded-lg max-w-md text-center mb-8"
          role="alert"
        >
          <p className="text-white text-sm">{error || validationError}</p>
        </div>
      )}

      {/* Sample article cards - icon + reading time only */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl mb-10">
        <TextCard
          title="Introduction"
          icon={<BookOpen />}
          wordCount={sampleTexts[0].wordCount}
          readingTime={sampleTexts[0].readingTime}
          onClick={() => handleSelectSampleText(0)}
        />
        <TextCard
          title="AI Future"
          icon={<Brain />}
          wordCount={sampleTexts[1].wordCount}
          readingTime={sampleTexts[1].readingTime}
          onClick={() => handleSelectSampleText(1)}
        />
        <TextCard
          title="Mindfulness"
          icon={<Sparkles />}
          wordCount={sampleTexts[2].wordCount}
          readingTime={sampleTexts[2].readingTime}
          onClick={() => handleSelectSampleText(2)}
        />
        <TextCard
          title="Internet History"
          icon={<History />}
          wordCount={sampleTexts[3].wordCount}
          readingTime={sampleTexts[3].readingTime}
          onClick={() => handleSelectSampleText(3)}
        />
      </div>

      {/* URL input - globe icon, no text labels */}
      <div className="w-full max-w-xl">
        <form onSubmit={handleUrlSubmit} className="w-full">
          <div className="relative flex items-center overflow-hidden rounded-full bg-white/10 backdrop-blur-sm transition-all hover:bg-white/15">
            <div className="absolute left-4 text-white/70">
              <Globe size={18} />
            </div>
            <input
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://..."
              className="w-full bg-transparent py-3 pl-12 pr-24 text-white placeholder-white/60 focus:outline-none"
              aria-label="Paste article URL to read"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 rounded-full bg-white/20 px-6 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/30 disabled:opacity-50"
              aria-label={isLoading ? "Loading article..." : "Extract and read article"}
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "→"
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
