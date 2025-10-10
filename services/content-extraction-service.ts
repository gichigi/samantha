/**
 * Content Extraction Service - Simplified Firecrawl-First Approach
 * 
 * Always uses Firecrawl for content extraction with basic fallback
 */

import * as cheerio from "cheerio"
import { getFirecrawlService } from "./firecrawl-service"
import { validateContentType } from "@/utils/url-validation"

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
          // Check for 4xx/5xx errors specifically
          if (response.status >= 400 && response.status < 600) {
            throw this.createError(
              ExtractionErrorType.ACCESS_ERROR,
              "I can't read this article. Try a different one?",
            )
          }
          
          throw this.createError(
            ExtractionErrorType.ACCESS_ERROR,
            "I can't read this article. Try a different one?",
          )
        }

      // Check Content-Type to ensure it's not a blocked file type
      const contentType = response.headers.get('content-type')
      const contentTypeValidation = validateContentType(contentType)
      
      if (!contentTypeValidation.isValid) {
        console.error("Content-Type validation failed:", contentType, contentTypeValidation.error?.code)
        throw this.createError(
          ExtractionErrorType.ACCESS_ERROR,
          contentTypeValidation.error?.message || 'Unsupported content type',
          contentTypeValidation.error?.suggestion
        )
      }

      console.log(`✓ Content-Type validation passed: ${contentType}`)

      const html = await response.text()
      const $ = cheerio.load(html)
      
      // Check for error pages (404, 500, etc.) by looking for specific indicators
      const pageTitle = $('title').text()
      const pageTitleLower = pageTitle.toLowerCase()
      
      // More specific error page indicators - focus on title and common error page patterns
      const errorPagePatterns = [
        // HTTP status codes
        /^404/i,
        /^500/i,
        /^403/i,
        /^401/i,
        // Common error page titles
        'page not found',
        'not found',
        'this page does not exist',
        'cannot find the page',
        'the page you requested',
        'error - page not found',
        '404 - page not found',
        '404 error',
        'server error',
        'internal server error',
        'access denied',
        'forbidden',
        'unauthorized'
      ]
      
      // Check title first (most reliable indicator)
      const isErrorPage = errorPagePatterns.some(pattern => {
        if (pattern instanceof RegExp) {
          return pattern.test(pageTitleLower)
        }
        return pageTitleLower.includes(pattern)
      })
      
      if (isErrorPage) {
        console.warn('Basic fallback: Detected error page content in title:', pageTitle)
        throw this.createError(
          ExtractionErrorType.ACCESS_ERROR,
          "I can't read this article. Try a different one?",
        )
      }
      
      // Only check content for very specific error indicators (less likely to be false positives)
      const bodyText = $('body').text().toLowerCase()
      const specificContentErrors = [
        '404 error',
        'page not found',
        'this page does not exist',
        'the requested page could not be found'
      ]
      
      // Check if content is mostly error message (short content with error indicators)
      if (bodyText.length < 500 && specificContentErrors.some(indicator => bodyText.includes(indicator))) {
        console.warn('Basic fallback: Detected error page content in short content')
        throw this.createError(
          ExtractionErrorType.ACCESS_ERROR,
          "I can't read this article. Try a different one?",
        )
      }
      
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
