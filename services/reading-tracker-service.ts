"use client"

// This service will be used to track reading in the main app
export class ReadingTrackerService {
  private static instance: ReadingTrackerService
  private isAuthenticated = false

  private constructor() {}

  public static getInstance(): ReadingTrackerService {
    if (!ReadingTrackerService.instance) {
      ReadingTrackerService.instance = new ReadingTrackerService()
    }
    return ReadingTrackerService.instance
  }

  public setAuthenticated(value: boolean): void {
    this.isAuthenticated = value
  }

  public async trackReading(url: string, title: string | null, wordCount: number): Promise<boolean> {
    if (!this.isAuthenticated) {
      console.log("User not authenticated, skipping reading tracking")
      return false
    }

    try {
      const response = await fetch("/api/reading-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleUrl: url,
          title,
          wordCount,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Handle quota exceeded
        if (response.status === 429) {
          console.warn("Daily word limit exceeded:", errorData)
          return false
        }

        throw new Error(errorData.error || "Failed to track reading")
      }

      return true
    } catch (error) {
      console.error("Error tracking reading:", error)
      return false
    }
  }
}

export function getReadingTrackerService(): ReadingTrackerService {
  return ReadingTrackerService.getInstance()
}
