"use client"

import { createContext, useContext, useState, useRef, type ReactNode } from "react"
import { getReadingTrackerService } from "@/services/reading-tracker-service"

interface ReaderContextProps {
  // Content state
  currentTextIndex: number
  currentTitle: string
  currentUrl: string
  audioUrl: string | null
  currentText: string
  processedText: string
  wordCount: number

  // UI state
  activeWordIndex: number
  useTimestampHighlighting: boolean

  // Actions
  setCurrentTextIndex: (index: number) => void
  setCurrentTitle: (title: string) => void
  setCurrentUrl: (url: string) => void
  setAudioUrl: (url: string | null) => void
  setActiveWordIndex: (index: number) => void
  setUseTimestampHighlighting: (use: boolean) => void
  setCurrentText: (text: string) => void
  setProcessedText: (text: string) => void

  // Reading tracking
  trackReading: (url: string, title: string, wordCount: number) => Promise<boolean>
}

const ReaderContext = createContext<ReaderContextProps | undefined>(undefined)

export function ReaderProvider({ children }: { children: ReactNode }) {
  // Content state
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [currentTitle, setCurrentTitle] = useState("")
  const [currentUrl, setCurrentUrl] = useState("")
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [currentText, setCurrentText] = useState("")
  const [processedText, setProcessedText] = useState("")
  const [wordCount, setWordCount] = useState(0)

  // UI state
  const [activeWordIndex, setActiveWordIndex] = useState(0)
  const [useTimestampHighlighting, setUseTimestampHighlighting] = useState(false)

  // Reading tracker service
  const readingTrackerRef = useRef<ReturnType<typeof getReadingTrackerService> | null>(null)

  // Initialize reading tracker if needed
  const getReadingTracker = () => {
    if (!readingTrackerRef.current && typeof window !== "undefined") {
      readingTrackerRef.current = getReadingTrackerService()
    }
    return readingTrackerRef.current
  }

  // Track reading
  const trackReading = async (url: string, title: string, wordCount: number) => {
    const tracker = getReadingTracker()
    if (!tracker) return false

    return await tracker.trackReading(url, title, wordCount)
  }

  // Update word count when text changes
  const updateCurrentText = (text: string) => {
    setCurrentText(text)
    setWordCount(text.split(/\s+/).filter((word) => word.length > 0).length)
  }

  const value = {
    currentTextIndex,
    currentTitle,
    currentUrl,
    audioUrl,
    currentText,
    processedText,
    wordCount,
    activeWordIndex,
    useTimestampHighlighting,
    setCurrentTextIndex,
    setCurrentTitle,
    setCurrentUrl,
    setAudioUrl,
    setActiveWordIndex,
    setUseTimestampHighlighting,
    setCurrentText: updateCurrentText,
    setProcessedText,
    trackReading,
  }

  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>
}

export function useReader() {
  const context = useContext(ReaderContext)
  if (context === undefined) {
    throw new Error("useReader must be used within a ReaderProvider")
  }
  return context
}
