import { NextResponse } from "next/server"
import { getContentExtractionService, ExtractionErrorType } from "@/services/content-extraction-service"

export async function POST(request: Request) {
  try {
    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (err) {
      console.error("Failed to parse request body:", err)
      return NextResponse.json({ 
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid request body",
          suggestion: "Make sure you're sending a valid JSON object with a 'url' field."
        }
      }, { status: 400 })
    }

    // Validate request
    const url = body?.url
    if (!url) {
      return NextResponse.json({ 
        error: {
          code: "MISSING_URL",
          message: "URL is required",
          suggestion: "Please provide a valid URL to extract content from."
        }
      }, { status: 400 })
    }

    console.log(`Extracting content from URL: ${url}`)
    
    // Get the content extraction service
    const extractionService = getContentExtractionService({
      // Configure service options
      timeout: 15000, // 15 seconds
      includeImages: false
    })
    
    try {
      // Extract content using our improved service
      const extractionResult = await extractionService.extractContent(url)
      
      // Log extraction info for debugging
      if (extractionResult.extractionInfo) {
        console.log(`Content extracted using strategy: ${extractionResult.extractionInfo.strategy}`)
        console.log(`Extraction score: ${extractionResult.extractionInfo.score}`)
        console.log(`Execution time: ${extractionResult.extractionInfo.executionTime}ms`)
        
        if (extractionResult.extractionInfo.isPartialContent) {
          console.warn("Returning partial content due to timeout or other issues")
        }
      }
      
      // Return the extracted content
      return NextResponse.json({
        title: extractionResult.title,
        content: extractionResult.content,
        byline: extractionResult.byline,
        siteName: extractionResult.siteName,
        wordCount: extractionResult.wordCount,
        extractionInfo: extractionResult.extractionInfo
      })
      
    } catch (error) {
      // Handle extraction errors with specific error messages and suggestions
      if (error.code) {
        // This is a structured error from our extraction service
        console.error(`Content extraction error: ${error.code} - ${error.message}`)
        
        let statusCode = 500
        
        // Map error types to appropriate status codes
        switch (error.code) {
          case ExtractionErrorType.ACCESS_ERROR:
            statusCode = 403
            break
          case ExtractionErrorType.FETCH_ERROR:
            statusCode = 502
            break
          case ExtractionErrorType.CONTENT_NOT_FOUND:
            statusCode = 404
            break
          case ExtractionErrorType.TIMEOUT_ERROR:
            statusCode = 504
            break
          case ExtractionErrorType.PARSING_ERROR:
          case ExtractionErrorType.UNKNOWN_ERROR:
          default:
            statusCode = 500
            break
        }
        
        return NextResponse.json({ error }, { status: statusCode })
      } else {
        // Fallback for unexpected errors
        console.error("Unexpected error during content extraction:", error)
        return NextResponse.json({ 
          error: {
            code: "EXTRACTION_FAILED",
            message: error.message || "Failed to extract content from the URL",
            suggestion: "Please try a different URL or check your internet connection."
          }
        }, { status: 500 })
      }
    }
  } catch (error) {
    // Catch any other unexpected errors
    console.error("Unexpected error in extract-url API route:", error)
    return NextResponse.json({ 
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred",
        suggestion: "Please try again later. If the problem persists, contact support."
      }
    }, { status: 500 })
  }
}
