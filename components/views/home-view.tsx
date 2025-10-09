"use client"

import { useState, useEffect } from "react"
import { BookOpen, Brain, Sparkles, History, Globe } from "lucide-react"
import TextCard from "@/components/text-card"
import { sampleTexts } from "@/data/sample-texts"
import { useReader } from "@/contexts/reader-context"
import { useUrlExtraction } from "@/hooks/use-url-extraction"
import { useViewState } from "@/hooks/use-view-state"
import { LocalUsageService } from "@/services/local-usage-service"
import { validateUrl } from "@/utils/url-validation"

export default function HomeView() {
  const {
    setCurrentTextIndex,
    setCurrentTitle,
    setCurrentUrl,
    setUseTimestampHighlighting,
    setAudioUrl,
    setCurrentText,
  } = useReader()

  // Animation state
  const [showDivider, setShowDivider] = useState(false)
  const [showTitle, setShowTitle] = useState(false)
  const [showCard1, setShowCard1] = useState(false)
  const [showCard2, setShowCard2] = useState(false)
  const [showCard3, setShowCard3] = useState(false)
  const [showCard4, setShowCard4] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)

  const { transitionTo } = useViewState()
  const { isLoading, extractUrl, error: extractionError } = useUrlExtraction()
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  // Staggered animation sequence
  useEffect(() => {
    const timer1 = setTimeout(() => setShowDivider(true), 100)
    const timer2 = setTimeout(() => setShowTitle(true), 400)
    const timer3 = setTimeout(() => setShowCard1(true), 800)
    const timer4 = setTimeout(() => setShowCard2(true), 1000)
    const timer5 = setTimeout(() => setShowCard3(true), 1200)
    const timer6 = setTimeout(() => setShowCard4(true), 1400)
    const timer7 = setTimeout(() => setShowUrlInput(true), 1800)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      clearTimeout(timer5)
      clearTimeout(timer6)
      clearTimeout(timer7)
    }
  }, [])

  // Handle sample article selection with on-demand TTS generation
  const handleSelectSampleText = async (index: number) => {
    // Set the current text content
    setCurrentText(sampleTexts[index].content)
    setCurrentTextIndex(index)
    setCurrentTitle(sampleTexts[index].title)
    setUseTimestampHighlighting(false)
    
    // Clear any previous audio URL to force TTS generation
    setAudioUrl(null)

    // Show loading screen with smooth fade transition
    transitionTo("loading", true)
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate URL format using shared validation utility
    const validation = validateUrl(url.trim())
    if (!validation.isValid) {
      const errorMsg = validation.error?.message || "Invalid URL"
      setValidationError(errorMsg)
      console.error("URL validation failed:", validation.error?.code, errorMsg)
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
    <main className="min-h-screen bg-[#3b82f6] p-6 flex flex-col items-center justify-center" style={{paddingTop: '64px'}}>
      {/* Balanced Title with Samantha */}
      <div className="flex flex-col items-center mb-16">
        {/* Title with subtle background */}
        <div className="relative mb-12">
          {/* Subtle background shape */}
          <div className="absolute inset-0 -m-8 bg-white/5 rounded-3xl blur-xl"></div>
          <div className="absolute inset-0 -m-4 bg-white/3 rounded-2xl"></div>
          
          <div className={`relative transition-all duration-700 ease-out ${
            showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-wide px-8 py-4">
              Samantha
            </h1>
          </div>
          
          {/* More visible divider - separate animation */}
          <div className={`w-32 h-px bg-white/40 mt-4 mx-auto transition-all duration-500 ease-out ${
            showDivider ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`}></div>
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
        <div className={`transition-all duration-700 ease-out ${
          showCard1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <TextCard
            title="Introduction"
            icon={<BookOpen size={40} />}
            wordCount={sampleTexts[0].wordCount}
            readingTime={sampleTexts[0].readingTime}
            onClick={() => handleSelectSampleText(0)}
          />
        </div>
        <div className={`transition-all duration-700 ease-out ${
          showCard2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <TextCard
            title="AI Future"
            icon={<Brain size={40} />}
            wordCount={sampleTexts[1].wordCount}
            readingTime={sampleTexts[1].readingTime}
            onClick={() => handleSelectSampleText(1)}
          />
        </div>
        <div className={`transition-all duration-700 ease-out ${
          showCard3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <TextCard
            title="Mindfulness"
            icon={<Sparkles size={40} />}
            wordCount={sampleTexts[2].wordCount}
            readingTime={sampleTexts[2].readingTime}
            onClick={() => handleSelectSampleText(2)}
          />
        </div>
        <div className={`transition-all duration-700 ease-out ${
          showCard4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <TextCard
            title="Internet History"
            icon={<History size={40} />}
            wordCount={sampleTexts[3].wordCount}
            readingTime={sampleTexts[3].readingTime}
            onClick={() => handleSelectSampleText(3)}
          />
        </div>
      </div>

      {/* URL input - globe icon, no text labels */}
      <div className={`w-full max-w-xl transition-all duration-700 ease-out ${
        showUrlInput ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
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
