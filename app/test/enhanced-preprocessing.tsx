"use client"

import { useState } from "react"
import { ArrowLeft, Play, Pause, Download, Check } from "lucide-react"
import Link from "next/link"
import { getOpenAITTSService } from "@/services/openai-tts-service"

// Sample introduction text
const introText = `Welcome to Samantha.

She reads the internet, out loud, just for you.

Imagine having your favorite articles, blog posts, and stories read to you in a natural, expressive voice while you're commuting, exercising, or simply relaxing with your eyes closed. That's what Samantha does.

Unlike traditional text-to-speech systems that sound robotic and monotonous, Samantha uses advanced neural voice technology to create a listening experience that's engaging and pleasant. The subtle intonations, appropriate pauses, and natural rhythm make it feel like you're listening to a real person.

In the future, Samantha will be able to read any webpage you provide, transforming your digital reading list into a personal podcast. For now, enjoy this demonstration of what's possible with modern text-to-speech technology.`

export default function EnhancedPreprocessingPage() {
  const [originalText, setOriginalText] = useState(introText)
  const [processedText, setProcessedText] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [preprocessingMethod, setPreprocessingMethod] = useState("breathing")
  const [audioReady, setAudioReady] = useState(false)
  const [status, setStatus] = useState("")

  // Function to apply different preprocessing methods
  const applyPreprocessing = () => {
    let result = originalText

    switch (preprocessingMethod) {
      case "breathing":
        result = addBreathingMarkers(originalText)
        break
      case "prosody":
        result = addProsodyControl(originalText)
        break
      case "micropauses":
        result = addMicroPauses(originalText)
        break
      case "combined":
        result = addBreathingMarkers(originalText)
        result = addProsodyControl(result)
        result = addMicroPauses(result)
        break
      case "custom-intro":
        result = customIntroPreprocessing(originalText)
        break
      default:
        result = originalText
    }

    setProcessedText(result)
    return result
  }

  // Function to add breathing markers
  const addBreathingMarkers = (text: string): string => {
    return (
      text
        // Add breathing after periods with some probability
        .replace(/\.\s+/g, (match) => {
          // 40% chance to add a breath marker after a period
          return Math.random() < 0.4 ? ". (breath) " : match
        })
        // Add breathing after paragraphs
        .replace(/\n\n/g, "\n\n(breath) ")
    )
  }

  // Function to add prosody control
  const addProsodyControl = (text: string): string => {
    return (
      text
        // Emphasize important words
        .replace(/\b(important|key|critical|essential)\b/gi, "*$1*")
        // Add thoughtful pauses before complex transitions
        .replace(/,\s+(however|therefore|consequently|nevertheless)/gi, ", (pause:0.3) $1")
        // Add emphasis to questions
        .replace(/([^?]+)(\?)/g, "$1 (pitch:high) $2")
        // Add warmth to personal pronouns
        .replace(/\b(you|your|we|our)\b/gi, "(warm) $1")
    )
  }

  // Function to add micro-pauses
  const addMicroPauses = (text: string): string => {
    return (
      text
        // Add tiny pauses around commas, semicolons, and dashes
        .replace(/,/g, " (pause:0.1) ")
        .replace(/;/g, " (pause:0.2) ")
        .replace(/—/g, " (pause:0.15) — (pause:0.15) ")
    )
  }

  // Custom preprocessing specifically for the introduction
  const customIntroPreprocessing = (text: string): string => {
    if (text.includes("Welcome to Samantha")) {
      return `Welcome to Samantha. (pause:0.5) (breath)

She reads the internet, out loud, (pause:0.2) just for you. (pause:0.7)

(warm) Imagine having your favorite articles, blog posts, and stories read to you in a natural, expressive voice while you're commuting, exercising, or simply relaxing with your eyes closed. (pause:0.3) (breath) That's what Samantha does.

(pause:0.5) Unlike traditional text-to-speech systems that sound robotic and monotonous, Samantha uses advanced neural voice technology to create a listening experience that's engaging and pleasant. (breath) The subtle intonations, appropriate pauses, and natural rhythm make it feel like you're listening to a real person.

In the future, Samantha will be able to read any webpage you provide, (pause:0.2) transforming your digital reading list into a personal podcast. (pause:0.4) For now, enjoy this demonstration of what's possible with modern text-to-speech technology.`
    }
    return text
  }

  // Function to prepare audio
  const prepareAudio = async () => {
    setIsLoading(true)
    setStatus("Processing...")

    try {
      // Apply preprocessing
      const processedText = applyPreprocessing()

      // Get TTS service
      const ttsService = getOpenAITTSService()

      // Set to HD model
      ttsService.setModel("tts-1-hd")

      // Prepare audio with the processed text
      await ttsService.prepareWithText(processedText)

      setAudioReady(true)
      setStatus("Audio ready")
    } catch (error) {
      console.error("Error preparing audio:", error)
      setStatus("Error preparing audio")
    } finally {
      setIsLoading(false)
    }
  }

  // Function to toggle playback
  const togglePlayback = () => {
    const ttsService = getOpenAITTSService()

    if (isPlaying) {
      ttsService.pause()
      setIsPlaying(false)
    } else {
      ttsService.speak(0).catch((err) => {
        console.error("Error playing audio:", err)
      })
      setIsPlaying(true)
    }
  }

  // Function to download audio
  const downloadAudio = () => {
    const ttsService = getOpenAITTSService()
    ttsService.downloadAudio()
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/test" className="mr-4">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold">Enhanced TTS Preprocessing</h1>
          </div>
          <div className="text-sm">Using TTS-1-HD</div>
        </div>

        {/* Main content */}
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Select Preprocessing Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { id: "none", label: "No Preprocessing" },
                { id: "breathing", label: "Add Breathing" },
                { id: "prosody", label: "Prosody Control" },
                { id: "micropauses", label: "Micro-Pauses" },
                { id: "combined", label: "Combined Approach" },
                { id: "custom-intro", label: "Custom Intro" },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPreprocessingMethod(method.id)}
                  className={`p-3 rounded-lg border ${
                    preprocessingMethod === method.id
                      ? "bg-blue-100 border-blue-500 text-blue-700"
                      : "bg-white border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{method.label}</span>
                    {preprocessingMethod === method.id && <Check size={16} className="text-blue-600" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Original Text */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Original Text</h2>
              <textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                className="w-full h-64 p-3 border rounded-lg font-mono text-sm"
              />
            </div>

            {/* Processed Text */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Processed Text</h2>
              <div className="relative h-64">
                <textarea
                  value={processedText}
                  readOnly
                  className="w-full h-full p-3 border rounded-lg font-mono text-sm bg-gray-50"
                />
                <div className="absolute top-2 right-2">
                  <button
                    onClick={applyPreprocessing}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200"
                  >
                    Preview
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Note: Markers like (breath), (pause:0.3), etc. will be interpreted by the TTS engine
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={prepareAudio}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Prepare Audio"}
            </button>

            <button
              onClick={togglePlayback}
              disabled={!audioReady || isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Play
                </>
              )}
            </button>

            <button
              onClick={downloadAudio}
              disabled={!audioReady}
              className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 flex items-center"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Audio
            </button>
          </div>

          {/* Status */}
          {status && (
            <div className="mt-4 text-center">
              <div className="inline-block px-4 py-2 bg-gray-100 rounded-full text-sm">{status}</div>
            </div>
          )}

          {/* Explanation */}
          <div className="mt-8 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">About These Preprocessing Methods</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Add Breathing:</strong> Adds natural breathing sounds after periods and paragraphs to simulate a
                person taking breaths while speaking.
              </li>
              <li>
                <strong>Prosody Control:</strong> Adds emphasis to important words, varies pitch for questions, and adds
                warmth to personal pronouns.
              </li>
              <li>
                <strong>Micro-Pauses:</strong> Adds tiny pauses around punctuation to create a more natural rhythm and
                cadence.
              </li>
              <li>
                <strong>Combined Approach:</strong> Uses all three methods together for maximum naturalness.
              </li>
              <li>
                <strong>Custom Intro:</strong> A hand-crafted version of the introduction with carefully placed pauses,
                breathing, and emphasis.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
