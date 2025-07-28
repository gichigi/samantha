"use client"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import TimestampHighlighter from "@/components/timestamp-highlighter"

export default function TimestampDemoPage() {
  const searchParams = useSearchParams()
  const usePrerecorded = searchParams.get("prerecorded") !== "false" // Default to true
  const prerecordedAudioUrl =
    "https://aofhjlkcmpalyjjzlsam.supabase.co/storage/v1/object/public/audio//introduction-to-samantha.mp3"

  const [audioUrl, setAudioUrl] = useState<string | null>(usePrerecorded ? prerecordedAudioUrl : null)
  const [isLoading, setIsLoading] = useState(!usePrerecorded)
  const [error, setError] = useState<string | null>(null)

  // Define the timestamped segments based on the provided data
  const segments = [
    { text: "Welcome to Samantha. She reads the internet, out loud, just for you.", startTime: 0, endTime: 5 },
    {
      text: "Imagine having your favorite articles, blog posts, and stories read to you in a natural, expressive voice",
      startTime: 5,
      endTime: 10,
    },
    {
      text: "while you're commuting, exercising, or simply relaxing with your eyes closed.",
      startTime: 10,
      endTime: 16,
    },
    { text: "That's what Samantha does.", startTime: 16, endTime: 18 },
    {
      text: "Unlike traditional text-to-speech systems that sound robotic and monotonous,",
      startTime: 18,
      endTime: 22,
    },
    {
      text: "Samantha uses advanced neural voice technology to create a listening experience that's engaging and pleasant.",
      startTime: 22,
      endTime: 29,
    },
    {
      text: "The subtle intonations, appropriate pauses, and natural rhythm",
      startTime: 29,
      endTime: 33,
    },
    { text: "make it feel like you're listening to a real person.", startTime: 33, endTime: 36 },
    {
      text: "In the future, Samantha will be able to read any webpage you provide,",
      startTime: 36,
      endTime: 40,
    },
    {
      text: "transforming your digital reading list into a personal podcast.",
      startTime: 40,
      endTime: 45,
    },
    {
      text: "For now, enjoy this demonstration of what's possible with modern text-to-speech technology.",
      startTime: 45,
      // No endTime for the last segment - it will be calculated automatically
    },
  ]

  // Generate audio for the introduction text if not using prerecorded
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
            <h1 className="text-xl font-bold text-white">Introduction - Timestamp Demo</h1>
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
