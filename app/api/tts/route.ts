import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: Request) {
  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not defined")
      return NextResponse.json({ error: "API key is not configured" }, { status: 500 })
    }

    // Initialize OpenAI client with dangerouslyAllowBrowser flag
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    })

    // Parse request body with more robust error handling
    let body
    try {
      body = await request.json()
    } catch (err) {
      console.error("Failed to parse request body:", err)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Add null checks for body and its properties
    if (!body) {
      return NextResponse.json({ error: "Request body is empty" }, { status: 400 })
    }

    const text = body.text || ""
    const voice = body.voice || "nova"
    const speed = body.speed || 1.0

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    console.log(`Calling OpenAI TTS API with voice: ${voice}, speed: ${speed}, text length: ${text.length}`)

    // Call OpenAI TTS API with try/catch
    try {
      const mp3Response = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice,
        input: text,
        speed: speed,
      })

      // Get the audio data as an ArrayBuffer
      const buffer = await mp3Response.arrayBuffer()

      console.log(`Successfully generated speech, buffer size: ${buffer.byteLength}`)

      // Return the audio data with appropriate headers
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": buffer.byteLength.toString(),
        },
      })
    } catch (openaiError: any) {
      // More detailed error logging
      console.error("OpenAI API error details:", {
        message: openaiError?.message,
        status: openaiError?.status,
        response: openaiError?.response?.data,
        stack: openaiError?.stack,
      })

      return NextResponse.json(
        { error: `OpenAI API error: ${openaiError?.message || "Unknown error"}` },
        { status: openaiError?.status || 500 },
      )
    }
  } catch (error: any) {
    // More detailed error logging
    console.error("TTS API general error:", {
      message: error?.message,
      stack: error?.stack,
    })

    return NextResponse.json(
      { error: `Failed to generate speech: ${error?.message || "Unknown error"}` },
      { status: 500 },
    )
  }
}
