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

    // Check if user has reached their daily limit
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("daily_word_limit, words_used_today, last_usage_date")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("Error fetching user data:", userError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    // If user doesn't exist in our users table yet, create them
    if (!userData) {
      // Get user details from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(userId)

      if (!authUser?.user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Insert the user
      const { error: insertError } = await supabase.from("users").insert({
        id: userId,
        email: authUser.user.email || "",
        display_name: authUser.user.user_metadata.full_name || "",
        daily_word_limit: 10000,
        words_used_today: 0,
        last_usage_date: new Date().toISOString().split("T")[0],
      })

      if (insertError) {
        console.error("Error creating user:", insertError)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }
    } else {
      // Check if this is a new day
      const today = new Date().toISOString().split("T")[0]

      if (userData.last_usage_date < today) {
        // Reset the counter for a new day
        await supabase
          .from("users")
          .update({
            words_used_today: wordCount,
            last_usage_date: today,
          })
          .eq("id", userId)
      } else {
        // Check if adding this article would exceed the daily limit
        if (userData.words_used_today + wordCount > userData.daily_word_limit) {
          return NextResponse.json(
            {
              error: "Daily word limit exceeded",
              limit: userData.daily_word_limit,
              used: userData.words_used_today,
              remaining: userData.daily_word_limit - userData.words_used_today,
            },
            { status: 429 },
          )
        }

        // Update the word count
        await supabase
          .from("users")
          .update({
            words_used_today: userData.words_used_today + wordCount,
          })
          .eq("id", userId)
      }
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

    // Get user's usage stats
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("daily_word_limit, words_used_today")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("Error fetching user data:", userError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

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
        limit: userData?.daily_word_limit || 10000,
        used: userData?.words_used_today || 0,
        remaining: (userData?.daily_word_limit || 10000) - (userData?.words_used_today || 0),
      },
    })
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json({ error: `Server error: ${error.message || "Unknown error"}` }, { status: 500 })
  }
}
