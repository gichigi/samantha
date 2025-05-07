/**
 * Content Extraction Service
 * 
 * Provides an improved approach to web content extraction with:
 * - Multiple extraction strategies with quality scoring
 * - Structured error handling and reporting
 * - Timeout handling and partial content recovery
 */

import * as cheerio from "cheerio"
import TurndownService from "turndown"

// Define error types for better error handling
export enum ExtractionErrorType {
  ACCESS_ERROR = "ACCESS_ERROR",
  FETCH_ERROR = "FETCH_ERROR",
  CONTENT_NOT_FOUND = "CONTENT_NOT_FOUND",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  PARSING_ERROR = "PARSING_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// Error structure for frontend consumption
export interface ExtractionError {
  code: ExtractionErrorType
  message: string
  suggestion?: string
  details?: any
}

// Content quality metrics used to score extraction results
interface ContentQualityMetrics {
  textLength: number
  paragraphCount: number
  textToHtmlRatio: number
  wordCount: number
  linkDensity: number
  headingCount: number
}

// Extraction result from each strategy
interface ExtractionResult {
  content: cheerio.Cheerio | null
  quality: ContentQualityMetrics
  score: number
  strategyName: string
}

// Extraction strategy definition
interface ExtractionStrategy {
  name: string
  description: string
  priority: number
  selectors: string[]
  execute: ($: cheerio.CheerioAPI) => ExtractionResult
}

// Configuration options for the extraction service
interface ExtractionConfig {
  timeout?: number // Milliseconds
  userAgent?: string
  includeImages?: boolean
  maxContentLength?: number
  minQualityScore?: number
}

// Default configuration
const DEFAULT_CONFIG: ExtractionConfig = {
  timeout: 15000, // 15 seconds
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  includeImages: false,
  maxContentLength: 100000,
  minQualityScore: 40
}

export class ContentExtractionService {
  private config: ExtractionConfig
  private strategies: ExtractionStrategy[]
  private turndownService: TurndownService
  
  constructor(config: ExtractionConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.strategies = this.initializeStrategies()
    this.turndownService = this.initializeTurndown()
  }
  
  /**
   * Main extraction method with timeout handling and error reporting
   */
  public async extractContent(url: string): Promise<{ 
    title: string, 
    content: string, 
    byline?: string,
    siteName?: string,
    wordCount: number,
    extractionInfo?: { 
      strategy: string, 
      score: number,
      executionTime: number,
      isPartialContent?: boolean
    }
  }> {
    const startTime = Date.now()
    let html = ""
    let $ = null
    let title = ""
    let byline = ""
    let siteName = ""
    
    try {
      // Fetch URL with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
      
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": this.config.userAgent || DEFAULT_CONFIG.userAgent
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw this.createError(
            ExtractionErrorType.ACCESS_ERROR,
            `Failed to fetch URL: ${response.status} ${response.statusText}`,
            "The website may be blocking access or require authentication."
          )
        }
        
        html = await response.text()
      } catch (error) {
        if (error.name === 'AbortError') {
          throw this.createError(
            ExtractionErrorType.TIMEOUT_ERROR,
            "Request timed out while fetching content",
            "The website might be slow or unresponsive. Try again later."
          )
        } else {
          throw this.createError(
            ExtractionErrorType.FETCH_ERROR,
            `Failed to fetch content: ${error.message}`,
            "Check your internet connection or try a different URL."
          )
        }
      }
      
      // Parse HTML
      try {
        $ = cheerio.load(html)
      } catch (error) {
        throw this.createError(
          ExtractionErrorType.PARSING_ERROR,
          `Failed to parse HTML: ${error.message}`,
          "The website's HTML may be malformed."
        )
      }
      
      // Extract basic metadata
      title = $("title").text().trim() || "Web Article"
      
      siteName = $('meta[property="og:site_name"]').attr("content") || 
                new URL(url).hostname
      
      byline = $('meta[name="author"]').attr("content") ||
              $('meta[property="article:author"]').attr("content") ||
              $(".author").first().text() ||
              $('[rel="author"]').first().text() ||
              ""
              
      // Clean the DOM to improve extraction quality
      this.cleanDom($)
      
      // Apply multiple extraction strategies and find the best result
      const bestResult = await this.applyExtractionStrategies($)
      
      if (!bestResult || !bestResult.content) {
        throw this.createError(
          ExtractionErrorType.CONTENT_NOT_FOUND,
          "Could not extract meaningful content from this page",
          "Try a different page that has more text content."
        )
      }
      
      // Convert content to markdown
      const markdown = this.convertToMarkdown(bestResult.content, $)
      
      // Calculate word count
      const wordCount = this.countWords(markdown)
      
      // Format the content
      const formattedContent = `# ${title}\n\n${byline ? `By ${byline}\n\n` : ""}${markdown}`
      
      const executionTime = Date.now() - startTime
      
      return {
        title,
        content: formattedContent,
        byline: byline || undefined,
        siteName,
        wordCount,
        extractionInfo: {
          strategy: bestResult.strategyName,
          score: bestResult.score,
          executionTime,
          isPartialContent: false
        }
      }
    } catch (error) {
      // If we have partial content from a timeout, try to extract what we can
      if (error.code === ExtractionErrorType.TIMEOUT_ERROR && $ !== null) {
        try {
          console.warn("Attempting partial content extraction after timeout...")
          
          // Use a less intensive strategy for partial content
          const partialContent = this.extractPartialContent($)
          
          if (partialContent && partialContent.length > 200) {
            const executionTime = Date.now() - startTime
            const wordCount = this.countWords(partialContent)
            
            return {
              title,
              content: `# ${title}\n\n${byline ? `By ${byline}\n\n` : ""}${partialContent}\n\n*Note: Content may be incomplete due to timeout.*`,
              byline: byline || undefined,
              siteName,
              wordCount,
              extractionInfo: {
                strategy: "partial_recovery",
                score: 0,
                executionTime,
                isPartialContent: true
              }
            }
          }
        } catch (partialError) {
          console.error("Failed to extract partial content:", partialError)
        }
      }
      
      // Re-throw the original error
      throw error.code ? error : this.createError(
        ExtractionErrorType.UNKNOWN_ERROR,
        `Extraction failed: ${error.message || "Unknown error"}`,
        "Please try a different URL."
      )
    }
  }
  
  /**
   * Create a structured error object
   */
  private createError(code: ExtractionErrorType, message: string, suggestion?: string, details?: any): ExtractionError {
    return { code, message, suggestion, details }
  }
  
  /**
   * Initialize extraction strategies in priority order
   */
  private initializeStrategies(): ExtractionStrategy[] {
    return [
      // Strategy 1: Main content elements
      {
        name: "main_content",
        description: "Extracts content from main/article elements",
        priority: 1,
        selectors: ["main", '[role="main"]', "article", ".article"],
        execute: ($) => {
          const elements = $("main, [role='main'], article, .article").first()
          const metrics = elements.length ? this.calculateQualityMetrics(elements, $) : { 
            textLength: 0, paragraphCount: 0, textToHtmlRatio: 0, wordCount: 0, linkDensity: 0, headingCount: 0 
          }
          
          return {
            content: elements.length ? elements : null,
            quality: metrics,
            score: this.calculateScore(metrics),
            strategyName: "main_content"
          }
        }
      },
      
      // Strategy 2: Content class elements
      {
        name: "content_class",
        description: "Extracts content from elements with content-related class names",
        priority: 2,
        selectors: [".content", "#content", ".entry-content", ".post-content", ".article-content", ".story-content"],
        execute: ($) => {
          const elements = $(".content, #content, .entry-content, .post-content, .article-content, .story-content").first()
          const metrics = elements.length ? this.calculateQualityMetrics(elements, $) : { 
            textLength: 0, paragraphCount: 0, textToHtmlRatio: 0, wordCount: 0, linkDensity: 0, headingCount: 0 
          }
          
          return {
            content: elements.length ? elements : null,
            quality: metrics,
            score: this.calculateScore(metrics),
            strategyName: "content_class"
          }
        }
      },
      
      // Strategy 3: Header + content detection
      {
        name: "header_content",
        description: "Finds heading elements and extracts their parent/sibling content",
        priority: 3,
        selectors: ["h1", "h2"],
        execute: ($) => {
          // Find first major heading that's likely to be the article title
          const heading = $("h1, h2").first()
          
          if (!heading.length) {
            return {
              content: null,
              quality: { textLength: 0, paragraphCount: 0, textToHtmlRatio: 0, wordCount: 0, linkDensity: 0, headingCount: 0 },
              score: 0,
              strategyName: "header_content"
            }
          }
          
          // Try to find the parent that contains both the heading and content
          const parent = heading.parent()
          
          // Check if the parent has enough content
          const metrics = this.calculateQualityMetrics(parent, $)
          
          // Only use this strategy if we found a good amount of content
          if (metrics.textLength > 1000 && metrics.paragraphCount > 3) {
            return {
              content: parent,
              quality: metrics,
              score: this.calculateScore(metrics),
              strategyName: "header_content"
            }
          }
          
          return {
            content: null,
            quality: { textLength: 0, paragraphCount: 0, textToHtmlRatio: 0, wordCount: 0, linkDensity: 0, headingCount: 0 },
            score: 0,
            strategyName: "header_content"
          }
        }
      },
      
      // Strategy 4: Largest text block
      {
        name: "largest_text_block",
        description: "Finds the element with the most text content",
        priority: 4,
        selectors: ["body *"],
        execute: ($) => {
          let bestElement = null
          let bestMetrics = { 
            textLength: 0, paragraphCount: 0, textToHtmlRatio: 0, wordCount: 0, linkDensity: 0, headingCount: 0 
          }
          let bestScore = 0
          
          // Check common container elements with significant content
          $("div, section, aside, main").each((_, element) => {
            const el = $(element)
            
            // Skip small elements and those likely to be navigation/footers
            if (el.find("p, h1, h2, h3, h4, h5, h6").length < 2) {
              return
            }
            
            // Calculate metrics
            const metrics = this.calculateQualityMetrics(el, $)
            const score = this.calculateScore(metrics)
            
            // Keep track of the element with the highest score
            if (score > bestScore) {
              bestElement = el
              bestMetrics = metrics
              bestScore = score
            }
          })
          
          return {
            content: bestElement,
            quality: bestMetrics,
            score: bestScore,
            strategyName: "largest_text_block"
          }
        }
      },
      
      // Strategy 5: Fallback to body with aggressive cleaning
      {
        name: "body_fallback",
        description: "Uses the body element with aggressive cleaning as a last resort",
        priority: 5,
        selectors: ["body"],
        execute: ($) => {
          // Apply more aggressive cleaning to the body
          this.aggressiveCleaning($)
          
          const body = $("body")
          const metrics = this.calculateQualityMetrics(body, $)
          
          return {
            content: body,
            quality: metrics,
            score: this.calculateScore(metrics) * 0.7, // Apply a penalty to this fallback
            strategyName: "body_fallback"
          }
        }
      }
    ]
  }
  
  /**
   * Initialize Turndown service for HTML to Markdown conversion
   */
  private initializeTurndown(): TurndownService {
    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      emDelimiter: "*",
      bulletListMarker: "-",
      strongDelimiter: "**",
      linkStyle: "inlined",
      linkReferenceStyle: "full",
      br: "  \n", // Two spaces followed by a newline for line breaks
    })

    // Add custom rules to better handle content
    turndownService.addRule("removeTwitterHandles", {
      filter: (node) => {
        return (
          node.nodeType === 3 &&
          node.nodeValue &&
          (node.nodeValue.includes("@") || node.nodeValue.includes("source=") || node.nodeValue.includes("?"))
        )
      },
      replacement: (content) => {
        // Clean up Twitter handles and URL parameters
        return content
          .replace(/@[\w]+/g, "") // Remove Twitter handles
          .replace(/\?source=.*?(?=\s|$)/g, "") // Remove URL source parameters
          .replace(/\[.*?\]\(.*?\)/g, "") // Remove markdown links
      },
    })

    // Remove empty links
    turndownService.addRule("removeEmptyLinks", {
      filter: (node) => {
        return node.nodeName === "A" && (!node.textContent || node.textContent.trim() === "")
      },
      replacement: () => "",
    })
    
    return turndownService
  }
  
  /**
   * Clean the DOM by removing elements unlikely to be part of the main content
   */
  private cleanDom($: cheerio.CheerioAPI): void {
    // Remove basic elements
    $("script, style, nav, footer, aside, iframe, noscript").remove()
    
    // Remove comment sections
    $('[class*="comment"], [id*="comment"]').remove()
    
    // Remove subscription elements
    $('[class*="subscribe"], [id*="subscribe"], [class*="newsletter"], [id*="newsletter"]').remove()
    
    // Remove author sections (we already extracted the author info)
    $('[class*="author"], [id*="author"]').remove()
    
    // Remove sidebars
    $('[class*="sidebar"], [id*="sidebar"]').remove()
    
    // Remove banners
    $('[class*="banner"], [id*="banner"], [role="banner"]').remove()
    
    // Remove ads
    $('[class*="advertisement"], [class*="advert"], [class*="ads"], [id*="ads"], [class*="ad-"], [id*="ad-"]').remove()
    
    // Remove related content
    $('[class*="related"], [id*="related"]').remove()
    
    // Remove recommended content
    $('[class*="recommended"], [id*="recommended"]').remove()
    
    // Remove popups and modals
    $('[class*="popup"], [id*="popup"], [class*="modal"], [id*="modal"]').remove()
    
    // Remove signup forms
    $('[class*="signup"], [id*="signup"], [class*="sign-up"], [id*="sign-up"]').remove()
    
    // Remove calls to action
    $('[class*="cta"], [id*="cta"], [class*="call-to-action"], [id*="call-to-action"]').remove()
    
    // Remove promotions
    $('[class*="promo"], [id*="promo"], [class*="promotion"], [id*="promotion"]').remove()
    
    // Remove social media widgets
    $('[class*="social"], [id*="social"], [class*="share"], [id*="share"]').remove()
  }
  
  /**
   * More aggressive cleaning for the fallback strategy
   */
  private aggressiveCleaning($: cheerio.CheerioAPI): void {
    // Remove elements with very little text content
    $("div, section, header").each((_, element) => {
      const el = $(element)
      if (el.text().trim().length < 50 && el.find("p, h1, h2, h3, h4, h5, h6").length === 0) {
        el.remove()
      }
    })
    
    // Remove elements with high link density
    $("div, section, ul").each((_, element) => {
      const el = $(element)
      const text = el.text().trim()
      const linkText = el.find("a").text().trim()
      
      if (text.length > 0 && linkText.length / text.length > 0.7) {
        el.remove()
      }
    })
  }
  
  /**
   * Calculate quality metrics for an element
   */
  private calculateQualityMetrics(element: cheerio.Cheerio, $: cheerio.CheerioAPI): ContentQualityMetrics {
    const html = element.html() || ""
    const text = element.text().trim()
    const paragraphs = element.find("p")
    const links = element.find("a")
    const headings = element.find("h1, h2, h3, h4, h5, h6")
    
    return {
      textLength: text.length,
      paragraphCount: paragraphs.length,
      textToHtmlRatio: html.length > 0 ? text.length / html.length : 0,
      wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
      linkDensity: text.length > 0 ? links.text().length / text.length : 1,
      headingCount: headings.length
    }
  }
  
  /**
   * Calculate a quality score based on metrics
   */
  private calculateScore(metrics: ContentQualityMetrics): number {
    if (metrics.textLength === 0) return 0
    
    let score = 0
    
    // Text length is the most important factor
    if (metrics.textLength > 3000) score += 40
    else if (metrics.textLength > 1500) score += 30
    else if (metrics.textLength > 800) score += 20
    else if (metrics.textLength > 300) score += 10
    else score += metrics.textLength / 30
    
    // Paragraph count indicates structured content
    if (metrics.paragraphCount > 8) score += 25
    else if (metrics.paragraphCount > 4) score += 15
    else if (metrics.paragraphCount > 2) score += 10
    else if (metrics.paragraphCount > 0) score += 5
    
    // Text-to-HTML ratio (higher is better)
    score += metrics.textToHtmlRatio * 50
    
    // Link density (lower is better)
    if (metrics.linkDensity < 0.1) score += 15
    else if (metrics.linkDensity < 0.2) score += 10
    else if (metrics.linkDensity < 0.3) score += 5
    else if (metrics.linkDensity > 0.5) score -= 10
    
    // Heading count indicates structured content
    if (metrics.headingCount > 0) score += 10
    
    return score
  }
  
  /**
   * Apply all extraction strategies and return the best result
   */
  private async applyExtractionStrategies($: cheerio.CheerioAPI): Promise<ExtractionResult | null> {
    let bestResult: ExtractionResult | null = null
    
    // Sort strategies by priority
    const sortedStrategies = [...this.strategies].sort((a, b) => a.priority - b.priority)
    
    for (const strategy of sortedStrategies) {
      try {
        console.log(`Applying extraction strategy: ${strategy.name}`)
        
        // Execute the strategy with a timeout
        const result = await this.executeWithTimeout(
          () => strategy.execute($),
          2000, // Individual strategy timeout
          `Strategy ${strategy.name} timed out`
        )
        
        if (result && result.content && result.score > 0) {
          console.log(`Strategy ${strategy.name} produced content with score ${result.score}`)
          
          // Update best result if this one is better
          if (!bestResult || result.score > bestResult.score) {
            bestResult = result
            
            // If we have a really good result, we can stop early
            if (result.score > 70) {
              console.log(`Found high-quality content with strategy ${strategy.name}, stopping early`)
              break
            }
          }
        } else {
          console.log(`Strategy ${strategy.name} failed to produce content`)
        }
      } catch (error) {
        console.warn(`Error in strategy ${strategy.name}:`, error)
        // Continue with next strategy
      }
    }
    
    return bestResult
  }
  
  /**
   * Execute a function with a timeout
   */
  private executeWithTimeout<T>(fn: () => T, timeout: number, timeoutMessage: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(timeoutMessage))
      }, timeout)
      
      try {
        const result = fn()
        clearTimeout(timeoutId)
        resolve(result)
      } catch (error) {
        clearTimeout(timeoutId)
        reject(error)
      }
    })
  }
  
  /**
   * Convert HTML content to Markdown
   */
  private convertToMarkdown(content: cheerio.Cheerio, $: cheerio.CheerioAPI): string {
    // Make a copy of the content to avoid modifying the original
    const contentHtml = content.html() || ""
    const $content = cheerio.load(contentHtml)
    
    // Additional cleaning specific to markdown conversion
    $content("script, style").remove()
    
    // Convert to markdown
    let markdown = this.turndownService.turndown($content.html() || "")
    
    // Clean up the markdown
    markdown = markdown
      // Remove excessive newlines
      .replace(/\n{3,}/g, "\n\n")
      // Remove empty links
      .replace(/\[]\(.*?\)/g, "")
      // Remove image markdown if configured
      .replace(/!\[.*?\]\(.*?\)/g, this.config.includeImages ? "$&" : "")
      // Ensure paragraphs are separated by double newlines
      .replace(/([^\n])\n([^\n])/g, "$1\n\n$2")
      // Remove any remaining HTML tags
      .replace(/<[^>]*>/g, "")
      
    return markdown
  }
  
  /**
   * Last resort method to extract partial content after a timeout
   */
  private extractPartialContent($: cheerio.CheerioAPI): string {
    // Apply aggressive cleaning to remove clutter
    this.aggressiveCleaning($)
    
    // Find paragraphs that look like content
    const contentParagraphs: string[] = []
    
    $("p").each((_, element) => {
      const text = $(element).text().trim()
      
      // Only include paragraphs that look like real content
      if (text.length > 50 && text.split(/\s+/).length > 10) {
        contentParagraphs.push(text)
      }
    })
    
    // If we found some paragraphs, return them
    if (contentParagraphs.length > 0) {
      return contentParagraphs.join("\n\n")
    }
    
    // Last resort: just get all text content from the body
    const bodyText = $("body").text()
      .replace(/\s+/g, " ")
      .trim()
      
    // Split into sentences
    const sentences = bodyText.match(/[^.!?]+[.!?]+/g) || []
    
    // Filter out short sentences and navigation items
    const contentSentences = sentences
      .filter(sentence => 
        sentence.trim().length > 40 && 
        sentence.split(/\s+/).length > 8 &&
        !sentence.includes("menu") &&
        !sentence.includes("navigation") &&
        !sentence.includes("copyright")
      )
      
    return contentSentences.join("\n\n")
  }
  
  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length
  }
}

// Create a singleton instance
let contentExtractionServiceInstance: ContentExtractionService | null = null

export function getContentExtractionService(config?: ExtractionConfig): ContentExtractionService {
  if (!contentExtractionServiceInstance) {
    contentExtractionServiceInstance = new ContentExtractionService(config)
  }
  return contentExtractionServiceInstance
} 