"use client"

import { useCallback } from "react"
import { useReader } from "@/contexts/reader-context"
import { useUrlExtraction } from "@/hooks/use-url-extraction"
import { sampleTexts } from "@/data/sample-texts"
import { LocalUsageService } from "@/services/local-usage-service"

export interface UseArticleLoaderProps {
  onError?: (error: string) => void
  onSuccess?: () => void
}

export function useArticleLoader({ onError, onSuccess }: UseArticleLoaderProps = {}) {
  const {
    setCurrentText,
    setCurrentTitle,
    setCurrentByline,
    setCurrentUrl,
    setCurrentTextIndex,
    setUseTimestampHighlighting,
    setAudioUrl,
  } = useReader()

  const { extractUrl, isLoading, error: extractionError } = useUrlExtraction()

  // Clear all article state before loading new article
  const clearArticleState = useCallback(() => {
    setCurrentText("")
    setCurrentTitle("")
    setCurrentByline(undefined)
    setCurrentUrl("")
    setCurrentTextIndex(0)
    setUseTimestampHighlighting(false)
    setAudioUrl(null)
  }, [
    setCurrentText,
    setCurrentTitle,
    setCurrentByline,
    setCurrentUrl,
    setCurrentTextIndex,
    setUseTimestampHighlighting,
    setAudioUrl,
  ])

  // Load sample article by index
  const loadSampleArticle = useCallback(async (index: number) => {
    try {
      // Validate index
      if (index < 0 || index >= sampleTexts.length) {
        throw new Error(`Invalid sample article index: ${index}`)
      }

      const sample = sampleTexts[index]
      
      // Clear state and set new article data
      clearArticleState()
      setCurrentText(sample.content)
      setCurrentTitle(sample.title)
      setCurrentUrl(`sample://${index}`)
      setCurrentTextIndex(index)
      setUseTimestampHighlighting(false)
      setAudioUrl(null) // Force TTS generation

      // Call success callback for navigation
      onSuccess?.()
      
      return true
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to load sample article"
      console.error("Error loading sample article:", error)
      onError?.(errorMsg)
      return false
    }
  }, [
    clearArticleState,
    setCurrentText,
    setCurrentTitle,
    setCurrentUrl,
    setCurrentTextIndex,
    setUseTimestampHighlighting,
    setAudioUrl,
    onError,
    onSuccess,
  ])

  // Load web article by URL
  const loadWebArticle = useCallback(async (url: string) => {
    try {
      // Check daily limit - TEMPORARILY DISABLED FOR TESTING
      // const canExtract = LocalUsageService.canExtract()
      // if (!canExtract) {
      //   const usage = LocalUsageService.getUsage()
      //   const resetTime = new Date(usage.resetDate).toLocaleTimeString('en-US', { 
      //     hour: 'numeric', 
      //     minute: '2-digit' 
      //   })
      //   // Return error message instead of throwing
      //   onError?.(`I've hit my daily limit. I'll be back at midnight`)
      //   return false
      // }

      // Clear state
      clearArticleState()

      // Extract content
      const extractedData = await extractUrl(url)
      if (!extractedData) {
        // Error is already set in useUrlExtraction hook and will be displayed
        // Don't navigate to loading page if extraction failed
        return false
      }

      // Increment usage count
      LocalUsageService.incrementUsage()
      
      // Dispatch event to update navbar
      window.dispatchEvent(new CustomEvent('usage-updated'))

      // Set article data
      setCurrentTitle(extractedData.title)
      setCurrentUrl(url)
      setCurrentText(extractedData.content)
      setUseTimestampHighlighting(false)
      setAudioUrl(null) // Force TTS generation

      // Call success callback for navigation
      onSuccess?.()
      
      return true
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to load web article"
      console.error("Error loading web article:", error)
      onError?.(errorMsg)
      return false
    }
  }, [
    clearArticleState,
    extractUrl,
    setCurrentTitle,
    setCurrentUrl,
    setCurrentText,
    setUseTimestampHighlighting,
    setAudioUrl,
    onError,
    onSuccess,
  ])

  // Main article loading function that handles both types
  const loadArticle = useCallback(async (url: string) => {
    if (url.startsWith('sample://')) {
      // Extract index from sample:// URL
      const index = parseInt(url.replace('sample://', ''), 10)
      return await loadSampleArticle(index)
    } else {
      // Regular web URL
      return await loadWebArticle(url)
    }
  }, [loadSampleArticle, loadWebArticle])

  return {
    loadArticle,
    loadSampleArticle,
    loadWebArticle,
    clearArticleState,
    isLoading,
    extractionError,
  }
}
