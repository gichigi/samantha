import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: Request) {
  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not defined")
      return NextResponse.json({ error: "API key is not configured" }, { status: 500 })
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (err) {
      console.error("Failed to parse request body:", err)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Validate request
    const text = body?.text
    const instructions = body?.instructions || ""

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    console.log(`Preprocessing text with GPT-4o, text length: ${text.length}`)

    try {
      // Initialize OpenAI client with dangerouslyAllowBrowser flag
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      })

      // Call OpenAI Chat API
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: instructions,
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.6,
        max_tokens: 4000,
      })

      // Check if response and content exist
      if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
        console.error("Invalid response from OpenAI:", response)
        return NextResponse.json({ error: "Invalid response from OpenAI" }, { status: 500 })
      }

      const preprocessedText = response.choices[0].message.content || text

      console.log(`Text preprocessed successfully, new length: ${preprocessedText.length}`)

      return NextResponse.json({
        text: preprocessedText,
      })
    } catch (openaiError: any) {
      console.error("OpenAI API error details:", {
        message: openaiError?.message,
        status: openaiError?.status,
        name: openaiError?.name,
        code: openaiError?.code,
        stack: openaiError?.stack,
      })

      return NextResponse.json(
        { error: `OpenAI API error: ${openaiError?.message || "Unknown error"}` },
        { status: openaiError?.status || 500 },
      )
    }
  } catch (error: any) {
    console.error("Preprocessing API general error:", {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    })

    return NextResponse.json(
      { error: `Failed to preprocess text: ${error?.message || "Unknown error"}` },
      { status: 500 },
    )
  }
}
