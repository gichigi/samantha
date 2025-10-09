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
    const title = body?.title || ""
    const instructions = body?.instructions || ""
    const model = body?.model || "gpt-4.5-preview" // Default to gpt-4.5-preview if not specified

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    console.log(`Preprocessing text with ${model}, text length: ${text.length}${title ? `, title: "${title}"` : ""}`)

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
          content: title ? `Title: ${title}\n\nContent: ${text}` : text,
        },
      ],
      temperature: 0.6, // Using the updated temperature value as requested
    }

    // Always use gpt-4o-mini for cost-effectiveness
    requestBody.model = "gpt-4o-mini"
    requestBody.max_tokens = 4000

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

      const fullResponse = responseData.choices[0].message.content || text
      
      // Extract normalized title if present
      let preprocessedText = fullResponse
      let normalizedTitle = title // Default to original title
      
      if (title && fullResponse.includes("NORMALIZED_TITLE:")) {
        const lines = fullResponse.split('\n')
        const titleLine = lines.find(line => line.trim().startsWith("NORMALIZED_TITLE:"))
        if (titleLine) {
          normalizedTitle = titleLine.replace("NORMALIZED_TITLE:", "").trim()
          // Remove the title line from the main text
          preprocessedText = lines.filter(line => !line.trim().startsWith("NORMALIZED_TITLE:")).join('\n').trim()
        }
      }

      console.log(`Text preprocessed successfully with ${model}, new length: ${preprocessedText.length}${normalizedTitle !== title ? `, normalized title: "${normalizedTitle}"` : ""}`)

      return NextResponse.json({
        text: preprocessedText,
        normalizedTitle: normalizedTitle,
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
