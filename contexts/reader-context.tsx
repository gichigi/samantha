"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { LocalHistoryService } from "@/services/local-history-service"

interface ReaderContextProps {
  // Content state
  currentTextIndex: number
  currentTitle: string
  currentByline: string | undefined
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
  setCurrentByline: (byline: string | undefined) => void
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
  const [currentByline, setCurrentByline] = useState<string | undefined>(undefined)
  const [currentUrl, setCurrentUrl] = useState("")
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [currentText, setCurrentText] = useState("")
  const [processedText, setProcessedText] = useState("")
  const [wordCount, setWordCount] = useState(0)

  // UI state
  const [activeWordIndex, setActiveWordIndex] = useState(0)
  const [useTimestampHighlighting, setUseTimestampHighlighting] = useState(false)

  // Track reading using localStorage
  const trackReading = async (url: string, title: string, wordCount: number) => {
    try {
      if (typeof window !== "undefined") {
        LocalHistoryService.addItem(title, url, wordCount)
        return true
      }
      return false
    } catch (error) {
      console.error("Error tracking reading:", error)
      return false
    }
  }

  // Update word count when text changes
  const updateCurrentText = (text: string) => {
    setCurrentText(text)
    setWordCount(text.split(/\s+/).filter((word) => word.length > 0).length)
  }

  const value = {
    currentTextIndex,
    currentTitle,
    currentByline,
    currentUrl,
    audioUrl,
    currentText,
    processedText,
    wordCount,
    activeWordIndex,
    useTimestampHighlighting,
    setCurrentTextIndex,
    setCurrentTitle,
    setCurrentByline,
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
