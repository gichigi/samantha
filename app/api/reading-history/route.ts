import { NextResponse } from "next/server"
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    // Create Supabase client with proper cookie handling
    const supabase = await createClient()

    // Get the current user from the session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      console.log("[POST] No session found, returning 401")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[POST] Session found for user:", session.user.email)
    const userId = session.user.id

    // Parse request body
    const { articleUrl, title, wordCount } = await request.json()

    if (!articleUrl || !wordCount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check daily extraction limit using daily_usage table
    const today = new Date().toISOString().split('T')[0]
    const { data: usageData } = await supabase
      .from("daily_usage")
      .select("extraction_count")
      .eq("user_id", userId)
      .eq("usage_date", today)
      .single()

    const dailyLimit = 3
    const usedToday = usageData?.extraction_count || 0

    if (usedToday >= dailyLimit) {
      return NextResponse.json(
        {
          error: "Daily extraction limit exceeded",
          limit: dailyLimit,
          used: usedToday,
          remaining: 0,
        },
        { status: 429 },
      )
    }

    // Record the reading history
    const { data, error } = await supabase
      .from("reading_history")
      .insert({
        user_id: userId,
        article_url: articleUrl,
        title: title || "Untitled Article",
        word_count: wordCount,
      })
      .select()
      .single()

    if (error) {
      console.error("Error recording reading history:", error)
      return NextResponse.json({ error: "Failed to record reading history" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json({ error: `Server error: ${error.message || "Unknown error"}` }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    // Create Supabase client with proper cookie handling
    const supabase = await createClient()

    // Get the current user from the session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      console.log("[GET] No session found, returning 401")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[GET] Session found for user:", session.user.email)
    const userId = session.user.id

    // Get URL parameters
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const page = Number.parseInt(searchParams.get("page") || "0")
    const offset = page * limit

    // Fetch reading history
    const { data, error, count } = await supabase
      .from("reading_history")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching reading history:", error)
      return NextResponse.json({ error: "Failed to fetch reading history" }, { status: 500 })
    }

    // Get user's usage stats from daily_usage table instead
    const { data: usageData } = await supabase
      .from("daily_usage")
      .select("extraction_count")
      .eq("user_id", userId)
      .eq("usage_date", new Date().toISOString().split('T')[0])
      .single()

    const usedToday = usageData?.extraction_count || 0

    return NextResponse.json({
      data,
      count,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
      usage: {
        limit: 3, // Daily extraction limit
        used: usedToday,
        remaining: Math.max(0, 3 - usedToday),
      },
    })
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json({ error: `Server error: ${error.message || "Unknown error"}` }, { status: 500 })
  }
}
