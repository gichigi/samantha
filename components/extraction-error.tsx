"use client"

import { AlertTriangle, Wifi, FileSearch, Clock, X, RefreshCw } from "lucide-react"

export interface ExtractionErrorProps {
  code: string
  message: string
  suggestion?: string
  onRetry?: () => void
  onDismiss?: () => void
}

export default function ExtractionError({
  code,
  message,
  suggestion,
  onRetry,
  onDismiss
}: ExtractionErrorProps) {
  // Get the appropriate icon based on error code
  const getIcon = () => {
    switch (code) {
      case "ACCESS_ERROR":
      case "FETCH_ERROR":
        return <Wifi className="h-6 w-6 text-red-400" />
      case "CONTENT_NOT_FOUND":
        return <FileSearch className="h-6 w-6 text-amber-400" />
      case "TIMEOUT_ERROR":
        return <Clock className="h-6 w-6 text-amber-400" />
      default:
        return <AlertTriangle className="h-6 w-6 text-red-400" />
    }
  }

  return (
    <div className="rounded-md bg-gray-50 p-4 border border-gray-200 shadow-sm">
      <div className="flex">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-800">{message}</h3>
          {suggestion && (
            <div className="mt-2 text-sm text-gray-600">
              <p>{suggestion}</p>
            </div>
          )}
          <div className="mt-4 flex gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <X className="mr-2 h-4 w-4" />
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 