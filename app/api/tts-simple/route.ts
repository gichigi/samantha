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
    const model = body?.model || "tts-1"

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    return await generateSpeech(apiKey, text, voice, speed, model)
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json({ error: `Server error: ${error.message || "Unknown error"}` }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    // Check if API key is available
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key is not configured" }, { status: 500 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const text = searchParams.get("text")
    const voice = searchParams.get("voice") || "nova"
    const speed = Number.parseFloat(searchParams.get("speed") || "1.0")
    const model = searchParams.get("model") || "tts-1"

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    return await generateSpeech(apiKey, text, voice, speed, model)
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json({ error: `Server error: ${error.message || "Unknown error"}` }, { status: 500 })
  }
}

async function generateSpeech(apiKey: string, text: string, voice: string, speed: number, model: string) {
  console.log(
    `Calling OpenAI TTS API with model: ${model}, voice: ${voice}, speed: ${speed}, text length: ${text.length}`,
  )

  // Prepare the request body
  const requestBody: any = {
    model: model,
    voice: voice,
    input: text,
    speed: speed,
    response_format: "mp3", // Explicitly specify mp3 format
  }

  // Optional voice settings for fine-tuning
  requestBody.voice_settings = {
    stability: 0.5,
    similarity_boost: 0.8,
  }

  // Call OpenAI API directly using fetch
  try {
    const openaiResponse = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
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

    // Return the audio data with appropriate headers
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Content-Disposition": `attachment; filename="samantha-audio.mp3"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error: any) {
    console.error("OpenAI API request failed:", error)
    return NextResponse.json(
      { error: `OpenAI API request failed: ${error.message || "Unknown error"}` },
      { status: 500 },
    )
  }
}
