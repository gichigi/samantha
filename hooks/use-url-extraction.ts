"use client"

import { useState } from "react"

interface ExtractedContent {
  title: string
  content: string
  byline?: string
  siteName?: string
  wordCount?: number
  extractionInfo?: {
    strategy: string
    score: number
    executionTime: number
    isPartialContent?: boolean
  }
}

export interface ExtractionError {
  code: string
  message: string
  suggestion?: string
  details?: any
}

export function useUrlExtraction() {
  const [isLoading, setIsLoading] = useState(false)
  const [extractionError, setExtractionError] = useState<ExtractionError | null>(null)
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null)

  const extractUrl = async (url: string) => {
    setIsLoading(true)
    setExtractionError(null)

    try {
      console.log("Extracting content from URL:", url)
      
      // Add timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout for the entire operation
      
      const response = await fetch("/api/extract-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      // Try to parse the JSON even if the response is not OK
      const data = await response.json().catch((e) => {
        console.error("Failed to parse JSON response:", e)
        return { 
          error: {
            code: "RESPONSE_PARSE_ERROR",
            message: "Failed to parse API response",
            suggestion: "Please try again or try a different URL"
          }
        }
      })

      // Handle error responses with structured error data
      if (!response.ok || data.error) {
        const errorData = data.error || {
          code: "HTTP_ERROR",
          message: `Request failed with status: ${response.status}`,
          suggestion: "Please check the URL and try again"
        }
        
        // Set error and return null instead of throwing
        setExtractionError(errorData)
        setIsLoading(false)
        return null
      }

      console.log("Extracted content:", {
        title: data.title,
        contentLength: data.content?.length || 0,
        byline: data.byline,
        siteName: data.siteName,
        wordCount: data.wordCount || 0,
        strategy: data.extractionInfo?.strategy || "unknown"
      })

      // If we received partial content due to timeout, inform the user
      if (data.extractionInfo?.isPartialContent) {
        console.warn("Received partial content due to timeout")
      }

      // The content is already in Markdown format from our service
      // No need for HTML sanitization
      const formattedContent = data.content

      const extractedData = {
        title: data.title,
        content: formattedContent,
        byline: data.byline,
        siteName: data.siteName,
        wordCount: data.wordCount,
        extractionInfo: data.extractionInfo
      }

      setExtractedContent(extractedData)

      setIsLoading(false)
      return extractedData
    } catch (error: any) {
      console.error("Error extracting URL content:", error)
      
      // Format the error consistently
      const formattedError = error.code 
        ? error // Already a structured error
        : {
            code: "EXTRACTION_FAILED",
            message: error.message || "Failed to extract content",
            suggestion: "Please try a different URL or check your internet connection"
          }
      
      setExtractionError(formattedError)
      setIsLoading(false)
      return null
    }
  }

  const retryExtraction = async (url: string) => {
    if (!url) return null
    
    return await extractUrl(url)
  }

  const clearError = () => {
    setExtractionError(null)
  }

  return {
    isLoading,
    error: extractionError,
    extractedContent,
    extractUrl,
    retryExtraction,
    clearError
  }
}
