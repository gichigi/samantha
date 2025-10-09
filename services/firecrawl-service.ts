/**
 * Firecrawl Service - Server-side only
 * 
 * Uses Firecrawl for content extraction from all URLs
 * This service must only be called from API routes (server-side)
 */

export interface FirecrawlExtractionResult {
  title: string
  content: string
  byline?: string
  siteName?: string
  wordCount: number
  extractionInfo: {
    strategy: string
    score: number
    executionTime: number
    isPartialContent: boolean
  }
}

export class FirecrawlService {
  /**
   * Extract content from a URL using Firecrawl with retry logic
   * Note: This uses server-side fetch, must be called from API routes
   */
  public async extractContent(url: string, retries = 2): Promise<FirecrawlExtractionResult | null> {
    const apiKey = process.env.FIRECRAWL_API_KEY
    if (!apiKey) {
      console.warn('FIRECRAWL_API_KEY not set')
      return null
    }

    let lastError: Error | null = null

    // Retry logic for transient API errors
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`Firecrawl: Extracting from ${url} (attempt ${attempt + 1}/${retries + 1})`)
        
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            url: url,
            formats: ['markdown'],
            onlyMainContent: true,
            removeBase64Images: true
          })
        })

        if (!response.ok) {
          // Retry on 5xx errors, not on 4xx
          if (response.status >= 500) {
            throw new Error(`Server error: ${response.status}`)
          } else {
            console.warn(`Firecrawl API client error: ${response.status}`)
            return null
          }
        }

        const result = await response.json()
        
        if (!result.success || !result.data?.markdown) {
          console.warn('Firecrawl: No markdown content returned')
          return null
        }
        
        const markdown = result.data.markdown
        const metadata = result.data.metadata || {}
        
        if (markdown.length < 100) {
          console.warn('Firecrawl: Content too short')
          return null
        }
        
        // Count words in the markdown
        const wordCount = markdown.split(/\s+/).filter((word: string) => word.length > 0).length
        
        // Extract title and author from metadata
        const title = metadata.title || 'Article'
        const author = metadata.author || undefined
        const siteName = this.extractSiteName(url)
        
        console.log(`✓ Firecrawl success: ${wordCount} words extracted`)
        
        return {
          title,
          content: markdown,
          byline: author,
          siteName,
          wordCount,
          extractionInfo: {
            strategy: 'firecrawl',
            score: 100,
            executionTime: 0,
            isPartialContent: false
          }
        }
        
      } catch (error) {
        lastError = error as Error
        
        // If it's a retryable error and not the last attempt, wait and retry
        if (attempt < retries && lastError.message.includes('Server error')) {
          const waitTime = Math.pow(2, attempt) * 1000 // 1s, 2s
          console.log(`Firecrawl retry in ${waitTime}ms...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        } else {
          console.error('Firecrawl error:', lastError)
          return null
        }
      }
    }

    return null
  }
  
  /**
   * Check if a URL should use Firecrawl
   * Always returns true - we use Firecrawl for all URLs now
   */
  public shouldUseFirecrawl(_url: string): boolean {
    return true
  }
  
  /**
   * Extract site name from URL
   */
  private extractSiteName(url: string): string {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname
      
      // Handle common cases
      if (hostname.includes('substack.com')) {
        return 'Substack'
      } else if (hostname.includes('medium.com')) {
        return 'Medium'
      } else if (hostname.includes('ghost.io')) {
        return 'Ghost'
      }
      
      // Default to hostname
      return hostname.replace('www.', '')
    } catch {
      return 'Unknown'
    }
  }
}

// Factory function
export function getFirecrawlService(): FirecrawlService {
  return new FirecrawlService()
}
