// Local storage-based usage tracking service
// Tracks daily article extractions without requiring authentication

export interface UsageStatus {
  count: number
  limit: number
  remaining: number
  canExtract: boolean
  resetDate: string
}

export class LocalUsageService {
  private static readonly DAILY_LIMIT = 999
  private static readonly STORAGE_KEY = 'samantha_usage'

  // Get current usage status
  static getUsage(): UsageStatus {
    const today = this.getTodayKey()
    const stored = this.getStoredUsage()

    // If stored date is not today, reset
    if (stored.date !== today) {
      this.resetUsage()
      return this.getDefaultUsage()
    }

    const count = stored.count
    const remaining = Math.max(0, this.DAILY_LIMIT - count)
    
    // Calculate reset date (tomorrow at midnight)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    return {
      count,
      limit: this.DAILY_LIMIT,
      remaining,
      canExtract: remaining > 0,
      resetDate: tomorrow.toISOString(),
    }
  }

  // Increment usage count
  static incrementUsage(): UsageStatus {
    const today = this.getTodayKey()
    const stored = this.getStoredUsage()

    // Reset if different day
    if (stored.date !== today) {
      this.resetUsage()
    }

    const newCount = (stored.date === today ? stored.count : 0) + 1
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      date: today,
      count: newCount
    }))

    return this.getUsage()
  }

  // Check if user can extract
  static canExtract(): boolean {
    const usage = this.getUsage()
    return usage.canExtract
  }

  // Reset usage (typically not needed as it auto-resets)
  static resetUsage(): void {
    const today = this.getTodayKey()
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      date: today,
      count: 0
    }))
  }

  // Private helper methods
  private static getTodayKey(): string {
    return new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  }

  private static getStoredUsage(): { date: string; count: number } {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error reading usage from localStorage:', error)
    }
    
    return { date: '', count: 0 }
  }

  private static getDefaultUsage(): UsageStatus {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    return {
      count: 0,
      limit: this.DAILY_LIMIT,
      remaining: this.DAILY_LIMIT,
      canExtract: true,
      resetDate: tomorrow.toISOString(),
    }
  }
}

