"use client"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import TimestampHighlighter from "@/components/timestamp-highlighter"

export default function TimestampDemoMindfulnessPage() {
  const searchParams = useSearchParams()
  const usePrerecorded = searchParams.get("prerecorded") !== "false" // Default to true
  const prerecordedAudioUrl =
    "https://aofhjlkcmpalyjjzlsam.supabase.co/storage/v1/object/public/audio//The-Art-of-Mindfulness.mp3"

  const [audioUrl, setAudioUrl] = useState<string | null>(usePrerecorded ? prerecordedAudioUrl : null)
  const [isLoading, setIsLoading] = useState(!usePrerecorded)
  const [error, setError] = useState<string | null>(null)

  // Define the timestamped segments based on the provided data
  const segments = [
    {
      text: "In our fast-paced, constantly connected world, the practice of mindfulness offers a path to greater peace and well-being.",
      startTime: 0,
      endTime: 8,
    },
    {
      text: "Mindfulness is the art of being fully present in the moment, aware of where we are and what we're doing,",
      startTime: 8,
      endTime: 14,
    },
    {
      text: "without being overly reactive or overwhelmed by what's going on around us.",
      startTime: 14,
      endTime: 20,
    },
    {
      text: "The concept of mindfulness has roots in Buddhist meditation,",
      startTime: 20,
      endTime: 23,
    },
    {
      text: "but it has evolved into a secular practice that is now widely embraced in various fields that from psychology to business.",
      startTime: 23,
      endTime: 31,
    },
    {
      text: "Research has shown that regular mindfulness practice can reduce stress, improve focus, enhance emotional regulation, and even boost immune function.",
      startTime: 31,
      endTime: 40,
    },
    {
      text: "So how does one practice mindfulness?",
      startTime: 40,
      endTime: 42,
    },
    {
      text: "At its core, mindfulness involves paying attention to your thoughts, feelings, bodily sensations, and the surrounding environment in a non-judgmental way.",
      startTime: 42,
      endTime: 51,
    },
    {
      text: "This might sound simple, but in a world filled with distractions, it can be surprisingly challenging.",
      startTime: 51,
      endTime: 58,
    },
    {
      text: "One common mindfulness exercise is mindful breathing.",
      startTime: 58,
      endTime: 61,
    },
    {
      text: "Find a comfortable position, close your eyes, and focus your attention on your breath.",
      startTime: 61,
      endTime: 67,
    },
    {
      text: "Notice the sensation of air moving in and out of your body.",
      startTime: 67,
      endTime: 71,
    },
    {
      text: "When your mind wanders, and it will, gently bring your attention back to your breath without judging yourself for getting distracted.",
      startTime: 71,
      endTime: 78,
    },
    {
      text: "Another practice is the body scan, where you systematically focus your attention on different parts of your body,",
      startTime: 78,
      endTime: 85,
    },
    {
      text: "from your toes to the top of your head, noticing any sensations without trying to change them.",
      startTime: 85,
      endTime: 91,
    },
    {
      text: "Mindful eating involves paying full attention to the experience of eating.",
      startTime: 91,
      endTime: 95,
    },
    {
      text: "Notice the colors, smells, textures, and flavors of your food.",
      startTime: 95,
      endTime: 99,
    },
    {
      text: "Eat slowly, savoring each bite, and noticing how your body feels as you nourish it.",
      startTime: 99,
      endTime: 105,
    },
    {
      text: "You can also practice mindfulness in everyday activities like walking, washing dishes, or taking a shower.",
      startTime: 105,
      endTime: 112,
    },
    {
      text: "The key is to fully engage with what you're doing, using all your senses to experience the present moment.",
      startTime: 112,
      endTime: 118,
    },
    {
      text: "Incorporating mindfulness into your daily routine doesn't require hours of meditation.",
      startTime: 118,
      endTime: 124,
    },
    {
      text: "Even a few minutes of mindful awareness scattered throughout your day can make a significant difference in how you feel,",
      startTime: 124,
      endTime: 130,
    },
    {
      text: "and how you respond to life's challenges.",
      startTime: 130,
      endTime: 132,
    },
    {
      text: "In a world that often values productivity and multitasking above all else,",
      startTime: 132,
      endTime: 138,
    },
    {
      text: "mindfulness reminds us of the importance of slowing down, being present, and finding peace in the midst of our busy lives.",
      startTime: 138,
      endTime: 146,
    },
    {
      text: "It's not about escaping reality, but rather about engaging with it more fully and compassionately.",
      startTime: 146,
      endTime: 153,
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
            <h1 className="text-xl font-bold text-white">The Art of Mindfulness - Timestamp Demo</h1>
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
