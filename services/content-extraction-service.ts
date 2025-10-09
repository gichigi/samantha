/**
 * Content Extraction Service - Simplified Firecrawl-First Approach
 * 
 * Always uses Firecrawl for content extraction with basic fallback
 */

import * as cheerio from "cheerio"
import { getFirecrawlService } from "./firecrawl-service"

// Error types for better error handling
export enum ExtractionErrorType {
  ACCESS_ERROR = "ACCESS_ERROR",
  FETCH_ERROR = "FETCH_ERROR",
  CONTENT_NOT_FOUND = "CONTENT_NOT_FOUND",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  PARSING_ERROR = "PARSING_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// Error structure for frontend
export interface ExtractionError {
  code: ExtractionErrorType
  message: string
  suggestion?: string
  details?: unknown
}

// Extraction result
export interface ExtractionResult {
  title: string
  content: string
  byline?: string
  siteName?: string
  wordCount: number
  extractionInfo?: {
    strategy: string
  score: number
    executionTime: number
    isPartialContent: boolean
  }
}

export class ContentExtractionService {
  /**
   * Extract content from any URL - Always tries Firecrawl first
   */
  public async extractContent(url: string): Promise<ExtractionResult> {
    const startTime = Date.now()
    
    try {
      // Validate URL
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw this.createError(
          ExtractionErrorType.ACCESS_ERROR,
          'Invalid URL protocol. Only HTTP and HTTPS are supported.'
        )
      }

      // Try Firecrawl first for ALL URLs
      console.log(`Attempting Firecrawl extraction for: ${url}`)
    const firecrawlService = getFirecrawlService()
      const firecrawlResult = await firecrawlService.extractContent(url)
      
      if (firecrawlResult && firecrawlResult.content.length > 100) {
        const executionTime = Date.now() - startTime
        console.log(`✓ Firecrawl success: ${firecrawlResult.wordCount} words in ${executionTime}ms`)
        
        return {
          ...firecrawlResult,
          extractionInfo: {
            ...firecrawlResult.extractionInfo,
            executionTime
          }
        }
      }

      // If Firecrawl fails, use basic fallback
      console.log('Firecrawl failed, trying basic fetch fallback...')
      return await this.basicFallback(url, startTime)
      
    } catch (error) {
      console.error('Extraction error:', error)
      
      if (error instanceof Error && 'code' in error) {
        throw error // Already an ExtractionError
      }
      
      // Try fallback on error
      try {
        console.log('Error occurred, attempting fallback extraction...')
        return await this.basicFallback(url, startTime)
      } catch (fallbackError) {
        throw this.createError(
          ExtractionErrorType.UNKNOWN_ERROR,
          'Failed to extract content from this URL',
          'Try a different article or check if the URL is accessible'
        )
      }
    }
  }

  /**
   * Basic fallback extraction using cheerio for proper HTML parsing
   */
  private async basicFallback(url: string, startTime: number): Promise<ExtractionResult> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
        const response = await fetch(url, {
        signal: controller.signal,
          headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw this.createError(
            ExtractionErrorType.ACCESS_ERROR,
          `Failed to fetch URL: ${response.status} ${response.statusText}`
        )
      }

      const html = await response.text()
      const $ = cheerio.load(html)
      
      // Extract title - try multiple sources
      let title = $('meta[property="og:title"]').attr('content') ||
                  $('meta[name="twitter:title"]').attr('content') ||
                  $('title').text() ||
                  $('h1').first().text() ||
                  'Article'
      
      title = title.trim()

      // Remove scripts, styles, navigation, footer
      $('script, style, nav, footer, header, .nav, .footer, .header, #nav, #footer, #header').remove()
      
      // Try common article selectors
      let $content = $('article').first()
      if ($content.length === 0) {
        $content = $('[role="main"]').first()
      }
      if ($content.length === 0) {
        $content = $('.post-content, .article-content, .entry-content, main').first()
      }
      if ($content.length === 0) {
        // Fallback to body
        $content = $('body')
      }

      // Extract clean text from selected content
      const content = $content
        .find('p, h1, h2, h3, h4, h5, h6')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(text => text.length > 0)
        .join('\n\n')

      if (!content || content.length < 100) {
        throw this.createError(
          ExtractionErrorType.CONTENT_NOT_FOUND,
          'No meaningful content found in the page'
        )
      }

      const wordCount = content.split(/\s+/).filter(w => w.length > 0).length
      const executionTime = Date.now() - startTime

      console.log(`✓ Basic fallback success: ${wordCount} words in ${executionTime}ms`)
      
      return {
        title,
        content,
        wordCount,
        extractionInfo: {
          strategy: 'basic_fallback',
          score: 50,
          executionTime,
          isPartialContent: true
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError(
          ExtractionErrorType.TIMEOUT_ERROR,
          'Request timed out',
          'The page took too long to load. Try again or use a different URL.'
        )
      }
      throw error
    }
  }
  
  /**
   * Create a structured error
   */
  private createError(
    code: ExtractionErrorType,
    message: string,
    suggestion?: string
  ): ExtractionError {
    const error = new Error(message) as Error & ExtractionError
    error.code = code
    error.message = message
    error.suggestion = suggestion
    return error
  }
}

// Factory function
export function getContentExtractionService(): ContentExtractionService {
  return new ContentExtractionService()
}
