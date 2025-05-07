import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Check if API key is available
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
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
    const voice = body?.voice || "nova"
    const speed = body?.speed || 1.0

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Check if text might be too long for GPT-4o-TTS
    if (text.length > 2000) {
      console.warn(`Text is ${text.length} characters, which may exceed the 2000 token limit for GPT-4o-TTS`)
    }

    console.log(`Calling OpenAI GPT-4o-TTS API with voice: ${voice}, speed: ${speed}, text length: ${text.length}`)

    try {
      // Call OpenAI API directly using fetch
      const openaiResponse = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-tts",
          voice: voice,
          input: text,
          speed: speed,
          response_format: "mp3",
        }),
      })

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}))
        console.error("OpenAI API error:", errorData)
        return NextResponse.json(
          { error: `OpenAI GPT-4o-TTS API error: ${errorData.error?.message || "Unknown error"}` },
          { status: openaiResponse.status },
        )
      }

      // Get the audio data as an ArrayBuffer
      const audioBuffer = await openaiResponse.arrayBuffer()
      console.log(`Successfully received GPT-4o-TTS audio data, size: ${audioBuffer.byteLength} bytes`)

      // Return the audio data with appropriate headers
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": audioBuffer.byteLength.toString(),
          "Content-Disposition": `attachment; filename="gpt4o-tts-audio.mp3"`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    } catch (error: any) {
      console.error("OpenAI GPT-4o-TTS API request failed:", error)
      return NextResponse.json(
        { error: `OpenAI GPT-4o-TTS API request failed: ${error.message || "Unknown error"}` },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json({ error: `Server error: ${error.message || "Unknown error"}` }, { status: 500 })
  }
}
