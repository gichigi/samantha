"use client"

import { useState } from "react"
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

  // Process text and prepare audio
  const processText = async (text: string) => {
    setIsLoading(true)

    // Sanitize the input text
    const sanitizedText = sanitizeText(text)

    try {
      const ttsService = getOpenAITTSService()

      // Set up progress callback
      ttsService.setCallbacks(
        () => {}, // onWordChange - handled elsewhere
        () => {}, // onFinish - handled elsewhere
        () => {
          if (onError) onError("Autoplay blocked by browser")
        },
        (progress) => {
          if (onProgressUpdate) onProgressUpdate(progress)
        },
      )

      // Prepare the TTS with the sanitized text (includes preprocessing)
      const processed = await ttsService.prepare(sanitizedText)

      // Store the processed text
      setProcessedText(processed)

      // Get the audio URL
      const audioUrl = ttsService.getAudioUrl()
      
      if (!audioUrl) {
        console.error("No audio URL from TTS service")
        setIsLoading(false)
        return null
      }

      console.log("Audio ready:", audioUrl)
      if (onAudioReady) {
        onAudioReady(audioUrl)
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

  return {
    isLoading,
    processText,
  }
}
