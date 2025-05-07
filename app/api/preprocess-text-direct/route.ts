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
    const instructions = body?.instructions || ""
    const model = body?.model || "gpt-4.5-preview" // Default to gpt-4.5-preview if not specified

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    console.log(`Preprocessing text with ${model}, text length: ${text.length}`)

    // Determine the correct API endpoint and parameters based on model
    const apiEndpoint = "https://api.openai.com/v1/chat/completions"
    const requestBody: any = {
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
      temperature: 0.6, // Using the updated temperature value as requested
    }

    // Set model-specific parameters
    switch (model) {
      case "gpt-4o":
        requestBody.model = "gpt-4o"
        requestBody.max_tokens = 4000
        break
      case "gpt-4.5-preview":
        requestBody.model = "gpt-4.5-preview"
        requestBody.max_tokens = 4000
        break
      case "gpt-o3":
        requestBody.model = "gpt-o3"
        requestBody.max_tokens = 4000
        break
      default:
        // Default to gpt-4.5-preview
        requestBody.model = "gpt-4.5-preview"
        requestBody.max_tokens = 4000
    }

    try {
      // Call OpenAI Chat API directly using fetch
      const openaiResponse = await fetch(apiEndpoint, {
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

      const responseData = await openaiResponse.json()

      // Check if the response contains the expected data
      if (!responseData || !responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
        console.error("Invalid response from OpenAI:", responseData)
        return NextResponse.json({ error: "Invalid response from OpenAI" }, { status: 500 })
      }

      const preprocessedText = responseData.choices[0].message.content || text

      console.log(`Text preprocessed successfully with ${model}, new length: ${preprocessedText.length}`)

      return NextResponse.json({
        text: preprocessedText,
        model: model,
      })
    } catch (error: any) {
      console.error("OpenAI API request failed:", error)
      return NextResponse.json(
        { error: `OpenAI API request failed: ${error.message || "Unknown error"}` },
        { status: 500 },
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
