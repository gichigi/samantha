import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Check if API key is available
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key is not configured" }, { status: 500 })
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (err) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Validate request
    const text = body?.text
    const voice = body?.voice || "nova"
    const speed = body?.speed || 1.0

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    console.log(`Calling OpenAI TTS API directly with voice: ${voice}, text: "${text}"`)

    // Call OpenAI API directly using fetch
    try {
      const openaiResponse = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: voice,
          input: text,
          speed: speed,
          response_format: "mp3", // Explicitly specify mp3 format
        }),
      })

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}))
        console.error("OpenAI API error:", errorData)
        return NextResponse.json(
          { error: `OpenAI API error: ${errorData.error?.message || "Unknown error"}` },
          { status: openaiResponse.status },
        )
      }

      // Get the audio data as an ArrayBuffer
      const audioBuffer = await openaiResponse.arrayBuffer()
      console.log(`Successfully received audio data, size: ${audioBuffer.byteLength} bytes`)

      // Return a JSON response with a download URL
      return NextResponse.json({
        success: true,
        message: "Audio generated successfully",
        size: audioBuffer.byteLength,
      })
    } catch (error: any) {
      console.error("OpenAI API request failed:", error)
      return NextResponse.json(
        { error: `OpenAI API request failed: ${error.message || "Unknown error"}` },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json({ error: `Server error: ${error.message || "Unknown error"}` }, { status: 500 })
  }
}
