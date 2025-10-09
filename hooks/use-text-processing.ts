"use client"

import { useState, useRef } from "react"
import { getOpenAITTSService } from "@/services/openai-tts-service"
import { useReader } from "@/contexts/reader-context"

interface UseTextProcessingProps {
  onProgressUpdate?: (progress: number) => void
  onAudioReady?: (audioUrl: string) => void
  onError?: (error: string) => void
}

export function useTextProcessing({ onProgressUpdate, onAudioReady, onError }: UseTextProcessingProps = {}) {
  const { setProcessedText } = useReader()
  const [isLoading, setIsLoading] = useState(false)
  const [wordCount, setWordCount] = useState(0)

  const ttsServiceRef = useRef<ReturnType<typeof getOpenAITTSService> | null>(null)

  // Initialize TTS service if not already done
  const initTTSService = () => {
    if (!ttsServiceRef.current && typeof window !== "undefined") {
      try {
        const ttsService = getOpenAITTSService()
        ttsServiceRef.current = ttsService

        // Set up callbacks
        ttsService.setCallbacks(
          () => {}, // onWordChange - handled elsewhere
          () => {}, // onFinish - handled elsewhere
          () => {
            if (onError) onError("Autoplay is blocked by your browser")
          },
          (progress) => {
            if (onProgressUpdate) onProgressUpdate(progress)
          },
        )

        return ttsService
      } catch (error: any) {
        if (onError) onError(`Failed to initialize TTS: ${error.message || "Unknown error"}`)
        return null
      }
    }

    return ttsServiceRef.current
  }

  // Process text and prepare audio
  const processText = async (text: string) => {
    setIsLoading(true)

    // Sanitize the input text to remove any potential HTML or problematic content
    const sanitizedText = sanitizeText(text)

    // Update word count based on sanitized text
    const words = sanitizedText.split(/\s+/).filter((word) => word.length > 0).length
    setWordCount(words)

    const ttsService = initTTSService()
    if (!ttsService) {
      setIsLoading(false)
      return null
    }

    try {
      // Prepare the TTS with the sanitized text
      const processed = await ttsService.prepare(sanitizedText)

      // Store the processed text
      setProcessedText(processed)

      // Get the audio URL
      const audioUrl = ttsService.getAudioUrl()
      
      if (!audioUrl) {
        console.error("No audio URL returned from TTS service")
        setIsLoading(false)
        return null
      }

      // Call the callback if provided (LoadingView will use this to set audioUrl)
      console.log(`Calling onAudioReady callback: ${!!onAudioReady}, audioUrl: ${audioUrl}`)
      if (onAudioReady) {
        onAudioReady(audioUrl)
      } else {
        console.warn("No onAudioReady callback provided!")
      }

      setIsLoading(false)
      return audioUrl
    } catch (error: any) {
      console.error("Failed to process text:", error)
      if (onError) onError(`Failed to process text: ${error.message || "Unknown error"}`)
      setIsLoading(false)
      return null
    }
  }

  // Sanitize text to remove HTML and problematic content
  const sanitizeText = (text: string): string => {
    // Remove any remaining HTML tags
    let sanitized = text.replace(/<[^>]*>/g, "")

    // Remove Twitter handles and URL parameters
    sanitized = sanitized
      .replace(/@[\w]+/g, "")
      .replace(/\?source=.*?(?=\s|$)/g, "")
      .replace(/\[.*?\]$$.*?$$/g, "") // Remove markdown links

    // Decode HTML entities
    sanitized = sanitized
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")

    return sanitized
  }

  // Update TTS settings
  const updateSettings = (voice?: string, speed?: number, model?: string) => {
    const ttsService = initTTSService()
    if (!ttsService) return false

    if (voice) ttsService.setVoice(voice)
    if (speed) ttsService.setSpeed(speed)
    if (model) ttsService.setModel(model)

    return true
  }

  // Get current TTS settings
  const getSettings = () => {
    const ttsService = initTTSService()
    if (!ttsService) return null

    return ttsService.getSettings()
  }

  return {
    isLoading,
    wordCount,
    processText,
    updateSettings,
    getSettings,
  }
}
