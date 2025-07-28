import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { UsageTrackerService } from "@/services/usage-tracker-service"

export async function GET() {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication required to view usage status"
        }
      }, { status: 401 })
    }

    const userId = session.user.id

    // Get usage status
    const usage = await UsageTrackerService.getUserUsage(userId)
    
    return NextResponse.json(usage)
  } catch (error) {
    console.error("Error getting usage status:", error)
    return NextResponse.json({ 
      error: {
        code: "SERVER_ERROR",
        message: "Failed to get usage status"
      }
    }, { status: 500 })
  }
} 