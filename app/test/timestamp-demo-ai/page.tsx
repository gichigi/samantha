"use client"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import TimestampHighlighter from "@/components/timestamp-highlighter"

export default function TimestampDemoAIPage() {
  const searchParams = useSearchParams()
  const usePrerecorded = searchParams.get("prerecorded") !== "false" // Default to true
  const prerecordedAudioUrl =
    "https://aofhjlkcmpalyjjzlsam.supabase.co/storage/v1/object/public/audio//The-Future-of-Artificial-Intelligence.mp3"

  const [audioUrl, setAudioUrl] = useState<string | null>(usePrerecorded ? prerecordedAudioUrl : null)
  const [isLoading, setIsLoading] = useState(!usePrerecorded)
  const [error, setError] = useState<string | null>(null)

  // Define the timestamped segments based on the provided data
  const segments = [
    {
      text: "Artificial intelligence is rapidly transforming our world in ways we could only imagine a decade ago.",
      startTime: 0,
      endTime: 6,
    },
    {
      text: "From self-driving cars to virtual assistants, AI technologies are becoming increasingly integrated into our daily lives.",
      startTime: 6,
      endTime: 14,
    },
    {
      text: "The field of AI has seen remarkable progress in recent years, particularly in the areas of machine learning and neural networks.",
      startTime: 14,
      endTime: 22,
    },
    {
      text: "These advancements have enabled computers to perform tasks that once required human intelligence, such as recognizing speech, translating languages, and even creating art.",
      startTime: 22,
      endTime: 33,
    },
    {
      text: "One of the most exciting developments is in natural language processing. Modern AI systems can now understand and generate human language with unprecedented accuracy.",
      startTime: 33,
      endTime: 43,
    },
    {
      text: "This has led to the creation of more natural-sounding text-to-speech systems, more effective translation tools, and chatbots that can engage in meaningful conversations.",
      startTime: 43,
      endTime: 53,
    },
    {
      text: "However, as AI becomes more powerful, it also raises important ethical questions.",
      startTime: 53,
      endTime: 58,
    },
    {
      text: "How do we ensure that AI systems are fair and unbiased? How do we protect privacy in a world where AI can analyze vast amounts of personal data?",
      startTime: 58,
      endTime: 66,
    },
    {
      text: "And perhaps most importantly, how do we ensure that AI remains a tool that benefits humanity rather than one that replaces human judgment and creativity?",
      startTime: 66,
      endTime: 77,
    },
    {
      text: "These questions don't have easy answers, but they highlight the importance of thoughtful development and regulation of AI technologies.",
      startTime: 77,
      endTime: 86,
    },
    {
      text: "As we continue to push the boundaries of what's possible with AI, we must also consider the implications of these technologies for society as a whole.",
      startTime: 86,
      endTime: 95,
    },
    {
      text: "The future of AI is both exciting and uncertain, but one thing is clear. AI will continue to play an increasingly important role in shaping our world in the years to come.",
      startTime: 95,
      endTime: 107,
    },
  ]

  // Generate audio for the text if not using prerecorded
  useEffect(() => {
    // If using prerecorded audio, we don't need to generate it
    if (usePrerecorded) return

    async function generateAudio() {
      setIsLoading(true)
      setError(null)

      try {
        // Combine all segments into a single text
        const fullText = segments.map((segment) => segment.text).join(" ")

        // Call the TTS API to generate audio
        const response = await fetch("/api/tts-simple", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: fullText,
            voice: "nova",
            speed: 1.0,
            model: "tts-1",
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to generate audio: ${response.status} ${response.statusText}`)
        }

        // Get the audio blob
        const audioBlob = await response.blob()

        // Create a URL for the blob
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        setIsLoading(false)
      } catch (err: any) {
        console.error("Error generating audio:", err)
        setError(err.message || "Failed to generate audio")
        setIsLoading(false)
      }
    }

    generateAudio()

    // Clean up the URL when component unmounts
    return () => {
      if (audioUrl && !usePrerecorded) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [usePrerecorded])

  return (
    <main className="min-h-screen bg-[#3b82f6]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-[#3b82f6]/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <Link href="/test" className="mr-4">
              <ArrowLeft className="h-6 w-6 text-white" />
            </Link>
            <h1 className="text-xl font-bold text-white">The Future of AI - Timestamp Demo</h1>
          </div>
          <div className="text-white text-sm">
            {usePrerecorded ? "Using pre-recorded audio" : "Using generated audio"}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pt-16">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[80vh] text-white">
            <div className="w-20 h-20 rounded-full bg-white/30 pulsating-orb mb-4"></div>
            <p>Generating audio...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[80vh] text-white">
            <div className="bg-red-500/20 p-4 rounded-lg max-w-md text-center">
              <p className="font-semibold">Error</p>
              <p className="font-normal">{error}</p>
            </div>
          </div>
        ) : audioUrl ? (
          <TimestampHighlighter
            segments={segments}
            audioSrc={audioUrl}
            onSegmentClick={(index) => console.log(`Clicked segment ${index}`)}
          />
        ) : null}
      </div>
    </main>
  )
}
