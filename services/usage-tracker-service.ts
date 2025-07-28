import { createClient } from '@/utils/supabase/server'

export interface UsageStatus {
  count: number
  limit: number
  remaining: number
  canExtract: boolean
  resetDate: string
}

export class UsageTrackerService {
  private static readonly DAILY_LIMIT = 3

  static async getUserUsage(userId: string): Promise<UsageStatus> {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    
    try {
      // Get or create today's usage record
      const { data: usage, error } = await supabase
        .from('daily_usage')
        .select('extraction_count')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .single()

      const count = usage?.extraction_count || 0
      const remaining = Math.max(0, this.DAILY_LIMIT - count)
      
      // Calculate reset date (tomorrow)
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
    } catch (error) {
      console.error('Error getting user usage:', error)
      
      // Return safe defaults on error
      return {
        count: this.DAILY_LIMIT, // Assume limit reached on error
        limit: this.DAILY_LIMIT,
        remaining: 0,
        canExtract: false,
        resetDate: new Date().toISOString(),
      }
    }
  }

  static async incrementUsage(userId: string): Promise<UsageStatus> {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    
    try {
      // Use the PostgreSQL function to properly increment
      const { error } = await supabase.rpc('increment_usage', {
        p_user_id: userId,
        p_usage_date: today
      })
      
      if (error) {
        console.error('Error incrementing usage:', error)
        throw error
      }

      // Return updated usage status
      return await this.getUserUsage(userId)
    } catch (error) {
      console.error('Error incrementing usage:', error)
      throw error
    }
  }

  static async canUserExtract(userId: string): Promise<boolean> {
    const usage = await this.getUserUsage(userId)
    return usage.canExtract
  }
} 