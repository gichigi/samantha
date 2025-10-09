/**
 * Shared URL validation utilities
 * Consolidates validation logic used across client and server
 */

// Blocked file extensions - expensive or unsupported formats
export const BLOCKED_EXTENSIONS = {
  pdf: ['.pdf'],
  documents: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
  archives: ['.zip', '.rar', '.tar', '.gz', '.7z'],
} as const

// Flatten all blocked extensions into a single array
export const ALL_BLOCKED_EXTENSIONS = [
  ...BLOCKED_EXTENSIONS.pdf,
  ...BLOCKED_EXTENSIONS.documents,
  ...BLOCKED_EXTENSIONS.archives,
]

// Blocked MIME types - detected via Content-Type header
export const BLOCKED_MIME_TYPES = {
  pdf: ['application/pdf'],
  documents: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  archives: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-tar',
    'application/gzip',
    'application/x-7z-compressed',
  ],
} as const

// Flatten all blocked MIME types
export const ALL_BLOCKED_MIME_TYPES = [
  ...BLOCKED_MIME_TYPES.pdf,
  ...BLOCKED_MIME_TYPES.documents,
  ...BLOCKED_MIME_TYPES.archives,
]

// Validation result type
export interface ValidationResult {
  isValid: boolean
  error?: {
    code: string
    message: string
    suggestion?: string
  }
}

/**
 * Validate URL format and check for blocked file types
 * @param url - URL string to validate
 * @returns Validation result with error details if invalid
 */
export function validateUrl(url: string): ValidationResult {
  // Check if URL is empty
  if (!url || !url.trim()) {
    return {
      isValid: false,
      error: {
        code: 'EMPTY_URL',
        message: 'URL cannot be empty',
        suggestion: 'Please paste a web article URL',
      },
    }
  }

  // Basic URL format validation
  let urlObj: URL
  try {
    urlObj = new URL(url.trim())
  } catch {
    return {
      isValid: false,
      error: {
        code: 'INVALID_URL_FORMAT',
        message: 'Invalid URL format',
        suggestion: 'Please enter a complete web address (like https://example.com/article)',
      },
    }
  }

  // Check for reasonable protocols
  if (!['http:', 'https:'].includes(urlObj.protocol)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_PROTOCOL',
        message: 'Only HTTP and HTTPS protocols are supported',
        suggestion: 'Please use a complete web address (like https://example.com)',
      },
    }
  }

  // Check for blocked file extensions in URL path
  const pathname = urlObj.pathname.toLowerCase()

  // Check PDF files specifically - they're expensive to process
  if (BLOCKED_EXTENSIONS.pdf.some((ext) => pathname.endsWith(ext))) {
    return {
      isValid: false,
      error: {
        code: 'UNSUPPORTED_FILE_TYPE',
        message: "Can't read PDF files",
        suggestion: 'Try copying a web article URL instead. PDFs are too expensive to process.',
      },
    }
  }

  // Check document files
  if (BLOCKED_EXTENSIONS.documents.some((ext) => pathname.endsWith(ext))) {
    return {
      isValid: false,
      error: {
        code: 'UNSUPPORTED_FILE_TYPE',
        message: "Can't read document files",
        suggestion: 'Please paste a web article URL instead.',
      },
    }
  }

  // Check archive files
  if (BLOCKED_EXTENSIONS.archives.some((ext) => pathname.endsWith(ext))) {
    return {
      isValid: false,
      error: {
        code: 'UNSUPPORTED_FILE_TYPE',
        message: "Can't read archive files",
        suggestion: 'Please paste a web article URL instead.',
      },
    }
  }

  // URL is valid
  return { isValid: true }
}

/**
 * Check Content-Type header for blocked MIME types
 * This catches files that lie about their extension
 * @param contentType - Content-Type header value
 * @returns Validation result with error details if blocked
 */
export function validateContentType(contentType: string | null): ValidationResult {
  if (!contentType) {
    // No Content-Type header - allow it (better than blocking legitimate content)
    return { isValid: true }
  }

  // Normalize the content type (remove charset and other parameters)
  const normalizedType = contentType.split(';')[0].trim().toLowerCase()

  // Check for PDF MIME type
  if (ALL_BLOCKED_MIME_TYPES.includes(normalizedType as any)) {
    // Determine the specific category for better error messaging
    if (BLOCKED_MIME_TYPES.pdf.includes(normalizedType as any)) {
      return {
        isValid: false,
        error: {
          code: 'UNSUPPORTED_CONTENT_TYPE',
          message: 'This URL points to a PDF file',
          suggestion: 'PDFs are too expensive to process. Try a web article instead.',
        },
      }
    }

    if (BLOCKED_MIME_TYPES.documents.includes(normalizedType as any)) {
      return {
        isValid: false,
        error: {
          code: 'UNSUPPORTED_CONTENT_TYPE',
          message: 'This URL points to a document file',
          suggestion: 'Document files are not supported. Please use a web article URL.',
        },
      }
    }

    if (BLOCKED_MIME_TYPES.archives.includes(normalizedType as any)) {
      return {
        isValid: false,
        error: {
          code: 'UNSUPPORTED_CONTENT_TYPE',
          message: 'This URL points to an archive file',
          suggestion: 'Archive files are not supported. Please use a web article URL.',
        },
      }
    }
  }

  // Content type is acceptable
  return { isValid: true }
}

/**
 * Get user-friendly error message for a validation error code
 * @param code - Error code
 * @returns User-friendly error message
 */
export function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    EMPTY_URL: 'Please paste a URL',
    INVALID_URL_FORMAT: 'Please enter a valid URL',
    INVALID_PROTOCOL: 'Please use HTTP or HTTPS',
    UNSUPPORTED_FILE_TYPE: "Can't read this file type",
    UNSUPPORTED_CONTENT_TYPE: "Can't read this content type",
  }

  return messages[code] || 'Validation failed'
}

