"use client"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import TimestampHighlighter from "@/components/timestamp-highlighter"

export default function TimestampDemoInternetPage() {
  const searchParams = useSearchParams()
  const usePrerecorded = searchParams.get("prerecorded") !== "false" // Default to true
  const prerecordedAudioUrl =
    "https://aofhjlkcmpalyjjzlsam.supabase.co/storage/v1/object/public/audio//The-History-of-the-Internet.mp3"

  const [audioUrl, setAudioUrl] = useState<string | null>(usePrerecorded ? prerecordedAudioUrl : null)
  const [isLoading, setIsLoading] = useState(!usePrerecorded)
  const [error, setError] = useState<string | null>(null)

  // Define the timestamped segments based on the provided data
  const segments = [
    {
      text: "The Internet, a global network connecting billions of computers and other electronic devices,",
      startTime: 0,
      endTime: 5,
    },
    {
      text: "has transformed modern life in countless ways.",
      startTime: 5,
      endTime: 9,
    },
    {
      text: "But this revolutionary technology had humble beginnings,",
      startTime: 9,
      endTime: 12,
    },
    {
      text: "evolving from a small network connecting a few research computers",
      startTime: 12,
      endTime: 16,
    },
    {
      text: "to the vast digital landscape we know today.",
      startTime: 16,
      endTime: 19,
    },
    {
      text: "The story begins in the late 1960s during the Cold War.",
      startTime: 19,
      endTime: 23,
    },
    {
      text: "The United States Department of Defense,",
      startTime: 23,
      endTime: 25,
    },
    {
      text: "concerned about the vulnerability of its communications systems to nuclear attack,",
      startTime: 25,
      endTime: 30,
    },
    {
      text: "created the Advanced Research Projects Agency network, ARPANET.",
      startTime: 30,
      endTime: 35,
    },
    {
      text: "Launched in 1969, ARPANET initially connected just four computers at research institutions,",
      startTime: 35,
      endTime: 41,
    },
    {
      text: "UCLA, Stanford Research Institute, UC Santa Barbara, and the University of Utah.",
      startTime: 41,
      endTime: 47,
    },
    {
      text: "ARPANET used a revolutionary technology called packet switching,",
      startTime: 47,
      endTime: 50,
    },
    {
      text: "which breaks data into small packets that can travel independently through the network",
      startTime: 50,
      endTime: 54,
    },
    {
      text: "and be reassembled at their destination.",
      startTime: 54,
      endTime: 58,
    },
    {
      text: "This approach allowed the network to continue functioning even if parts of it were damaged,",
      startTime: 58,
      endTime: 63,
    },
    {
      text: "a crucial feature for a communication system designed to survive a nuclear attack.",
      startTime: 63,
      endTime: 69,
    },
    {
      text: "In the 1970s, the network expanded and new protocols were developed",
      startTime: 69,
      endTime: 73,
    },
    {
      text: "to standardize how computers communicated with each other.",
      startTime: 73,
      endTime: 77,
    },
    {
      text: "The most important of these was the Transmission Control Protocol,",
      startTime: 77,
      endTime: 81,
    },
    {
      text: "Internet Protocol, TCP/IP, developed by Vint Cerf and Bob Kahn in 1974.",
      startTime: 81,
      endTime: 87,
    },
    {
      text: "The 1980s saw the birth of many technologies that would make the Internet",
      startTime: 87,
      endTime: 91,
    },
    {
      text: "more accessible and useful.",
      startTime: 91,
      endTime: 93,
    },
    {
      text: "In 1983, the Domain Name System, DNS, was introduced,",
      startTime: 93,
      endTime: 98,
    },
    {
      text: "providing a more user-friendly way to address computers on the network",
      startTime: 98,
      endTime: 101,
    },
    {
      text: "using names like example.com instead of numerical IP addresses.",
      startTime: 101,
      endTime: 106,
    },
    {
      text: "The turning point came with the invention of the World Wide Web",
      startTime: 106,
      endTime: 109,
    },
    {
      text: "by Tim Berners-Lee in 1989.",
      startTime: 109,
      endTime: 112,
    },
    {
      text: "Working at CERN, Berners-Lee developed the Hypertext Transfer Protocol, HTTP,",
      startTime: 112,
      endTime: 118,
    },
    {
      text: "which allowed for the creation of websites with hyperlinks",
      startTime: 118,
      endTime: 121,
    },
    {
      text: "that could connect to other sites.",
      startTime: 121,
      endTime: 123,
    },
    {
      text: "He also created the first web browser and web server.",
      startTime: 123,
      endTime: 127,
    },
    {
      text: "The web made the Internet much more accessible to non-technical users,",
      startTime: 127,
      endTime: 131,
    },
    {
      text: "and its popularity exploded in the mid-1990s",
      startTime: 131,
      endTime: 134,
    },
    {
      text: "with the release of user-friendly browsers like Mosaic and Netscape Navigator.",
      startTime: 134,
      endTime: 139,
    },
    {
      text: "This period, often called the dot-com boom,",
      startTime: 139,
      endTime: 142,
    },
    {
      text: "saw rapid growth in Internet usage",
      startTime: 142,
      endTime: 144,
    },
    {
      text: "and the creation of countless websites and online businesses.",
      startTime: 144,
      endTime: 148,
    },
    {
      text: "Today, the Internet continues to evolve,",
      startTime: 148,
      endTime: 151,
    },
    {
      text: "with technologies like cloud computing, the Internet of Things,",
      startTime: 151,
      endTime: 155,
    },
    {
      text: "IoT, and artificial intelligence.",
      startTime: 155,
      endTime: 157,
    },
    {
      text: "From its origins as a small research network",
      startTime: 157,
      endTime: 160,
    },
    {
      text: "to its current status as a global infrastructure,",
      startTime: 160,
      endTime: 163,
    },
    {
      text: "the Internet has had a profound impact on human society.",
      startTime: 163,
      endTime: 168,
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
            model: "tts-1-hd",
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
            <h1 className="text-xl font-bold text-white">The History of the Internet - Timestamp Demo</h1>
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
