"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, Play, Pause, RefreshCw, Download, Wand, Beaker, Check } from "lucide-react"
import Link from "next/link"
import { getOpenAITTSService } from "@/services/openai-tts-service"
import { sampleTexts } from "@/data/sample-texts"
import UrlInput from "@/components/url-input"
// Add this import at the top with the other imports
import SentenceHighlighterHiFi from "@/components/sentence-highlighter-hifi"

export default function TestPage() {
  // Text and preprocessing states
  const [selectedTextIndex, setSelectedTextIndex] = useState(0)
  const [originalText, setOriginalText] = useState("")
  const [preprocessedText, setPreprocessedText] = useState("")

  // Processing states
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preprocessingStatus, setPreprocessingStatus] = useState("")

  // Settings states
  const [ttsModel, setTtsModel] = useState("tts-1")
  const [preprocessingModel, setPreprocessingModel] = useState("gpt-4o")
  const [voice, setVoice] = useState("nova")
  const [speed, setSpeed] = useState(1.0)
  const [skipPreprocessing, setSkipPreprocessing] = useState(false)

  // Add these new state variables inside the TestPage component, after the other state declarations
  const [enhancedMode, setEnhancedMode] = useState(false)
  const [enhancedText, setEnhancedText] = useState("")
  const [preprocessingMethod, setPreprocessingMethod] = useState("none")
  // Add this new state variable inside the TestPage component, after the other state declarations
  const [showSentenceHighlighter, setShowSentenceHighlighter] = useState(false)

  const [isUrlLoading, setIsUrlLoading] = useState(false)
  const [urlText, setUrlText] = useState("")
  const [urlTitle, setUrlTitle] = useState("")

  // Track if audio is ready for each model
  const [audioReady, setAudioReady] = useState({
    "tts-1": false,
    "tts-1-hd": false,
    "gpt-4o-tts": false,
  })

  const ttsServiceRef = useRef<ReturnType<typeof getOpenAITTSService> | null>(null)

  // Inside the TestPage component, add these state variables
  const [selectedTimestampDemo, setSelectedTimestampDemo] = useState("introduction")
  const [usePrerecordedAudio, setUsePrerecordedAudio] = useState(true)

  // Add this after the other state variables in the TestPage component
  // const [usePrerecordedAudio, setUsePrerecordedAudio] = useState(true)
  const prerecordedAudioUrl =
    "https://aofhjlkcmpalyjjzlsam.supabase.co/storage/v1/object/public/audio//introduction-to-samantha.mp3"

  // Initialize TTS service
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const ttsService = getOpenAITTSService()
        ttsServiceRef.current = ttsService

        // Set initial text
        setOriginalText(sampleTexts[selectedTextIndex].content)

        // Set up callbacks
        ttsService.setCallbacks(
          () => {}, // onWordChange - not needed here
          () => {
            setIsPlaying(false)
          }, // onFinish
          () => {
            setError("Autoplay is blocked by your browser. Please click the play button to start.")
            setIsPlaying(false)
          }, // onAutoplayBlocked
          (progress) => {
            // Update preprocessing status
            setPreprocessingStatus(`Processing: ${progress.toFixed(0)}%`)
          }, // onProgressUpdate
        )
      } catch (error) {
        console.error("Error initializing TTS:", error)
        setError("Failed to initialize text-to-speech. Please try again.")
      }
    }

    // Cleanup
    return () => {
      if (ttsServiceRef.current) {
        ttsServiceRef.current.cleanup()
      }
    }
  }, [])

  // Function to preprocess text and prepare audio
  const preprocessAndPrepareAudio = async () => {
    setIsLoading(true)
    setError(null)
    setPreprocessingStatus("Starting...")

    try {
      // Update TTS service with the settings
      if (ttsServiceRef.current) {
        ttsServiceRef.current.setModel(ttsModel)
        ttsServiceRef.current.setVoice(voice)
        ttsServiceRef.current.setSpeed(speed)

        // Prepare the TTS with preprocessing if needed
        setPreprocessingStatus(
          skipPreprocessing ? "Generating audio..." : `Preprocessing with ${preprocessingModel}...`,
        )
        const processedText = await ttsServiceRef.current.prepare(originalText, {
          skipPreprocessing,
          preprocessModel: preprocessingModel,
        })

        // Set the processed text for display
        if (!skipPreprocessing) {
          setPreprocessedText(processedText)
        } else {
          setPreprocessedText(originalText) // If skipping preprocessing, show original
        }

        // Mark this model as ready
        setAudioReady((prev) => ({
          ...prev,
          [ttsModel]: true,
        }))

        setPreprocessingStatus("Audio ready")
      }
    } catch (error: any) {
      console.error("Error preprocessing text:", error)
      setError(`Processing failed: ${error.message}`)
      setPreprocessingStatus("Processing failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Try to switch TTS model without reprocessing
  const handleModelChange = async (newModel: string) => {
    if (!ttsServiceRef.current) return

    // Check if the audio for this model is cached
    const wasUpdated = await ttsServiceRef.current.updateAudioWithModel(newModel)

    if (wasUpdated) {
      // Audio was updated from cache
      setTtsModel(newModel)
      setPreprocessingStatus(`Switched to ${newModel} using cached audio`)
    } else {
      // Audio needs to be generated
      setTtsModel(newModel)
      setPreprocessingStatus(`Need to generate audio with ${newModel}`)

      // Check if this model is already processed
      if (audioReady[newModel as keyof typeof audioReady]) {
        setPreprocessingStatus(`${newModel} is already processed, switching`)
      } else {
        setPreprocessingStatus(`Please click Process & Prepare to generate audio with ${newModel}`)
      }
    }
  }

  // Function to toggle playback
  const togglePlayback = () => {
    if (!ttsServiceRef.current) return

    if (isPlaying) {
      ttsServiceRef.current.pause()
      setIsPlaying(false)
    } else {
      ttsServiceRef.current.speak(0).catch((err: any) => {
        console.error("Error starting playback:", err)
        setIsPlaying(false)
        setError(`Failed to play audio: ${err.message || "Unknown error"}`)
      })
      setIsPlaying(true)
    }
  }

  // Handle text selection change
  const handleTextChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = Number.parseInt(e.target.value)
    setSelectedTextIndex(index)
    setOriginalText(sampleTexts[index].content)
    setPreprocessedText("") // Clear preprocessed text when changing original
    setEnhancedText("")

    // Reset audio ready states when text changes
    setAudioReady({
      "tts-1": false,
      "tts-1-hd": false,
      "gpt-4o-tts": false,
    })
  }

  // Download current audio
  const handleDownload = () => {
    if (!ttsServiceRef.current) return
    ttsServiceRef.current.downloadAudio()
  }

  // Handle URL submission and extraction
  const handleUrlSubmit = (url: string) => {
    setIsUrlLoading(true)
    setError(null)

    console.log(`Processing URL: ${url}`)

    // Call the URL extraction API
    fetch("/api/extract-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    })
      .then(async (response) => {
        // Try to parse the JSON even if the response is not OK
        const data = await response.json().catch((e) => {
          console.error("Failed to parse JSON response:", e)
          return { error: `Failed to parse response: ${e.message}` }
        })

        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`)
        }

        return data
      })
      .then((data) => {
        if (data.error) {
          throw new Error(data.error)
        }

        console.log("URL extraction successful:", {
          title: data.title,
          contentLength: data.content?.length || 0,
        })

        // Set the extracted text as the original text
        setOriginalText(data.content)
        setUrlText(data.content)
        setUrlTitle(data.title)
        setPreprocessedText("") // Clear preprocessed text
        setEnhancedText("")

        // Reset audio ready states
        setAudioReady({
          "tts-1": false,
          "tts-1-hd": false,
          "gpt-4o-tts": false,
        })

        setIsUrlLoading(false)
      })
      .catch((error) => {
        console.error("Error extracting URL content:", error)
        setIsUrlLoading(false)
        setError(`Failed to extract content from URL: ${error.message}`)
      })
  }

  // Add this function after the handleDownload function
  // Function to apply different preprocessing methods
  const applyPreprocessing = useCallback(() => {
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

    setEnhancedText(result)
    return result
  }, [originalText, preprocessingMethod])

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

  // Add a new function to prepare audio with enhanced preprocessing
  const prepareEnhancedAudio = async () => {
    setIsLoading(true)
    setError(null)
    setPreprocessingStatus("Processing with enhanced preprocessing...")

    try {
      // Apply preprocessing
      const processedText = applyPreprocessing()

      // Get TTS service
      if (ttsServiceRef.current) {
        // Set to HD model
        ttsServiceRef.current.setModel("tts-1-hd")
        ttsServiceRef.current.setVoice(voice)
        ttsServiceRef.current.setSpeed(speed)

        // Prepare audio with the processed text
        await ttsServiceRef.current.prepareWithText(processedText)

        // Mark this model as ready
        setAudioReady((prev) => ({
          ...prev,
          "tts-1-hd": true,
        }))

        setTtsModel("tts-1-hd")
        setPreprocessingStatus("Enhanced audio ready")
      }
    } catch (error: any) {
      console.error("Error preparing enhanced audio:", error)
      setError(`Processing failed: ${error.message}`)
      setPreprocessingStatus("Enhanced processing failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Add this effect to update enhanced text when preprocessing method changes
  useEffect(() => {
    if (enhancedMode) {
      applyPreprocessing()
    }
  }, [preprocessingMethod, enhancedMode, applyPreprocessing])

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header with navigation */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="mr-4">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold">TTS Testing Lab</h1>
          </div>
          <div className="flex items-center">
            <Link href="/test/enhanced-preprocessing" className="flex items-center text-white hover:text-blue-200">
              <Beaker className="h-5 w-5 mr-2" />
              <span>Enhanced Preprocessing Lab</span>
            </Link>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-6 mt-4">{error}</div>
        )}

        {/* Main content */}
        <div className="p-4 md:p-6">
          {/* Step 1: Select text */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 text-sm">
                1
              </span>
              Select Text
            </h2>
            <div className="border rounded-lg p-4 bg-gray-50">
              <select value={selectedTextIndex} onChange={handleTextChange} className="w-full p-2 border rounded mb-4">
                {sampleTexts.map((text, index) => (
                  <option key={index} value={index}>
                    {text.title} ({text.wordCount} words)
                  </option>
                ))}
              </select>
              <textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                className="w-full h-36 p-2 border rounded font-mono text-sm"
                placeholder="Enter text to process..."
              />
            </div>
          </div>

          {/* URL Input */}
          <div className="mt-4">
            <h3 className="font-medium mb-2">Or Enter a URL</h3>
            <div className="flex flex-col">
              <UrlInput onSubmit={handleUrlSubmit} isLoading={isUrlLoading} darkMode={false} />
              {urlTitle && (
                <div className="mt-2 text-sm bg-blue-50 p-2 rounded">
                  <span className="font-medium">Extracted: </span>
                  {urlTitle}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Configure Text Processing */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 text-sm">
                2
              </span>
              Configure Processing
            </h2>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Preprocessing</h3>

                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="skipPreprocessing"
                      checked={skipPreprocessing}
                      onChange={(e) => setSkipPreprocessing(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="skipPreprocessing">Skip GPT preprocessing</label>
                  </div>

                  <div className={skipPreprocessing ? "opacity-50" : ""}>
                    <label className="block text-sm font-medium mb-1">Preprocessing Model</label>
                    <select
                      value={preprocessingModel}
                      onChange={(e) => setPreprocessingModel(e.target.value)}
                      disabled={skipPreprocessing}
                      className="w-full p-2 border rounded"
                    >
                      <option value="gpt-4o">GPT-4o (Default)</option>
                      <option value="gpt-4.5-preview">GPT-4.5 Preview</option>
                      <option value="gpt-o3">GPT-o3</option>
                    </select>
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          if (ttsServiceRef.current) {
                            ttsServiceRef.current.clearPreprocessCache()
                            setPreprocessingStatus("Preprocessing cache cleared")
                          }
                        }}
                        className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Clear Cache
                      </button>
                      <span className="text-xs text-gray-500 ml-2">
                        Use this if prompt changes aren't taking effect
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">TTS Settings</h3>

                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">TTS Model</label>
                    <select
                      value={ttsModel}
                      onChange={(e) => handleModelChange(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="tts-1">Standard (tts-1)</option>
                      <option value="tts-1-hd">HD (tts-1-hd)</option>
                      <option value="gpt-4o-tts">GPT-4o-TTS</option>
                    </select>
                    <div className="text-xs text-gray-500 mt-1">
                      {ttsModel === "gpt-4o-tts" && "Note: GPT-4o-TTS has a 2000 token limit"}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Voice</label>
                    <select
                      value={voice}
                      onChange={(e) => setVoice(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="nova">Nova (Female)</option>
                      <option value="alloy">Alloy (Neutral)</option>
                      <option value="echo">Echo (Male)</option>
                      <option value="fable">Fable (Young)</option>
                      <option value="onyx">Onyx (Deep Male)</option>
                      <option value="shimmer">Shimmer (Bright Female)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Speed: {speed.toFixed(2)}x</label>
                    <input
                      type="range"
                      min="0.25"
                      max="2.0"
                      step="0.05"
                      value={speed}
                      onChange={(e) => setSpeed(Number.parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                <button
                  onClick={preprocessAndPrepareAudio}
                  disabled={isLoading || !originalText}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center min-w-36"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wand className="h-4 w-4 mr-2" />
                      Process & Prepare Audio
                    </>
                  )}
                </button>
              </div>

              {preprocessingStatus && (
                <div className="mt-3 text-sm text-center text-gray-600 bg-gray-100 p-2 rounded">
                  {preprocessingStatus}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Preprocessing Section */}
          <div className="mb-8 mt-8 border-t pt-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <span className="bg-green-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 text-sm">
                +
              </span>
              Enhanced Preprocessing (TTS-1-HD)
            </h2>

            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="mb-4">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="enhancedMode"
                    checked={enhancedMode}
                    onChange={(e) => setEnhancedMode(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="enhancedMode" className="font-medium">
                    Enable Enhanced Preprocessing
                  </label>
                </div>

                {enhancedMode && (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      These lightweight preprocessing methods add subtle cues to make TTS-1-HD sound even more natural.
                    </p>

                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Select Preprocessing Method</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
                                ? "bg-green-100 border-green-500 text-green-700"
                                : "bg-white border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{method.label}</span>
                              {preprocessingMethod === method.id && <Check size={16} className="text-green-600" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Preview Enhanced Text</h3>
                      <div className="relative">
                        <textarea
                          value={enhancedText}
                          readOnly
                          className="w-full h-32 p-3 border rounded-lg font-mono text-sm bg-gray-50"
                        />
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={applyPreprocessing}
                            className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200"
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Note: Markers like (breath), (pause:0.3), etc. will be interpreted by the TTS engine
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={prepareEnhancedAudio}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Wand className="h-4 w-4 mr-2" />
                            Generate Enhanced Audio
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {enhancedMode && (
                <div className="mt-4 bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">About These Preprocessing Methods</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>
                      <strong>Add Breathing:</strong> Adds natural breathing sounds after periods and paragraphs to
                      simulate a person taking breaths while speaking.
                    </li>
                    <li>
                      <strong>Prosody Control:</strong> Adds emphasis to important words, varies pitch for questions,
                      and adds warmth to personal pronouns.
                    </li>
                    <li>
                      <strong>Micro-Pauses:</strong> Adds tiny pauses around punctuation to create a more natural rhythm
                      and cadence.
                    </li>
                    <li>
                      <strong>Combined Approach:</strong> Uses all three methods together for maximum naturalness.
                    </li>
                    <li>
                      <strong>Custom Intro:</strong> A hand-crafted version of the introduction with carefully placed
                      pauses, breathing, and emphasis.
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: View Results and Test */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 text-sm">
                3
              </span>
              Test and Compare
            </h2>
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Original Text Side */}
                <div className="border-b md:border-b-0 md:border-r">
                  <div className="p-4 bg-gray-50 border-b">
                    <h3 className="font-medium">Original Text</h3>
                  </div>
                  <div className="p-4 h-80 overflow-auto">
                    <pre className="whitespace-pre-wrap font-mono text-sm">{originalText}</pre>
                  </div>
                </div>

                {/* Processed Text Side */}
                <div>
                  <div className="p-4 bg-gray-50 border-b">
                    <h3 className="font-medium">
                      {enhancedMode
                        ? `Enhanced Text (${preprocessingMethod})`
                        : skipPreprocessing
                          ? "Text (Preprocessing Skipped)"
                          : `Processed Text (${preprocessingModel})`}
                    </h3>
                  </div>
                  <div className="p-4 h-80 overflow-auto">
                    {enhancedMode ? (
                      enhancedText ? (
                        <pre className="whitespace-pre-wrap font-mono text-sm">{enhancedText}</pre>
                      ) : (
                        <div className="text-center text-gray-500 pt-8">
                          Click "Process Enhanced Audio" to see the enhanced text
                        </div>
                      )
                    ) : preprocessedText ? (
                      <pre className="whitespace-pre-wrap font-mono text-sm">{preprocessedText}</pre>
                    ) : (
                      <div className="text-center text-gray-500 pt-8">
                        Click "Process & Prepare Audio" to see the processed text
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Audio Controls */}
              <div className="bg-gray-50 p-4 border-t flex flex-wrap justify-between items-center">
                <div className="text-sm font-medium">
                  {audioReady[ttsModel] ? (
                    <span className="text-green-600">✓ Audio Ready: {ttsModel}</span>
                  ) : (
                    <span className="text-gray-500">Audio not prepared yet</span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={togglePlayback}
                    disabled={!audioReady[ttsModel]}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownload}
                    disabled={!audioReady[ttsModel]}
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50 flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Sentence Highlighting Prototype */}
        <div className="mt-8 border-t pt-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <span className="bg-purple-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 text-sm">
              +
            </span>
            Sentence Highlighting Prototype
          </h2>

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="mb-4">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="showSentenceHighlighter"
                  checked={showSentenceHighlighter}
                  onChange={(e) => setShowSentenceHighlighter(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="showSentenceHighlighter" className="font-medium">
                  Show Sentence Highlighter
                </label>
              </div>

              {showSentenceHighlighter && (
                <div className="mt-4">
                  <div className="bg-purple-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-purple-800">
                      This prototype demonstrates sentence-level highlighting instead of word-by-word highlighting.
                      Click on any sentence to start playback from that point, or use the play button below. The UI and
                      animations match the main app experience.
                    </p>
                  </div>

                  <div className="h-[600px] bg-[#3b82f6] rounded-lg overflow-hidden">
                    <SentenceHighlighterHiFi
                      text={originalText}
                      onSentenceClick={(index) => console.log(`Clicked sentence ${index}`)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Timestamp-Based Highlighting Demo */}
        <div className="mt-8 border-t pt-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <span className="bg-green-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 text-sm">
              +
            </span>
            Timestamp-Based Highlighting Demo
          </h2>

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-4">
                This demo uses precise timestamps to highlight sentences in sync with the audio playback, providing a
                more accurate reading experience than algorithmic estimation.
              </p>

              <div className="mb-4">
                <h3 className="font-medium mb-2">Select Demo Content</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <button
                    onClick={() => setSelectedTimestampDemo("introduction")}
                    className={`p-3 rounded-lg border ${
                      selectedTimestampDemo === "introduction"
                        ? "bg-green-100 border-green-500 text-green-700"
                        : "bg-white border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Introduction to Samantha</span>
                      {selectedTimestampDemo === "introduction" && <Check size={16} className="text-green-600" />}
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTimestampDemo("ai-future")}
                    className={`p-3 rounded-lg border ${
                      selectedTimestampDemo === "ai-future"
                        ? "bg-green-100 border-green-500 text-green-700"
                        : "bg-white border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>The Future of AI</span>
                      {selectedTimestampDemo === "ai-future" && <Check size={16} className="text-green-600" />}
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTimestampDemo("mindfulness")}
                    className={`p-3 rounded-lg border ${
                      selectedTimestampDemo === "mindfulness"
                        ? "bg-green-100 border-green-500 text-green-700"
                        : "bg-white border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>The Art of Mindfulness</span>
                      {selectedTimestampDemo === "mindfulness" && <Check size={16} className="text-green-600" />}
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTimestampDemo("internet")}
                    className={`p-3 rounded-lg border ${
                      selectedTimestampDemo === "internet"
                        ? "bg-green-100 border-green-500 text-green-700"
                        : "bg-white border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>History of the Internet</span>
                      {selectedTimestampDemo === "internet" && <Check size={16} className="text-green-600" />}
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="usePrerecordedAudio"
                  checked={usePrerecordedAudio}
                  onChange={(e) => setUsePrerecordedAudio(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="usePrerecordedAudio" className="text-sm font-medium">
                  Use pre-recorded audio from Supabase (faster loading)
                </label>
              </div>

              <div className="flex justify-center">
                {selectedTimestampDemo === "introduction" ? (
                  <Link
                    href={`/test/timestamp-demo${usePrerecordedAudio ? "?prerecorded=true" : "?prerecorded=false"}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View Introduction Demo
                  </Link>
                ) : selectedTimestampDemo === "ai-future" ? (
                  <Link
                    href={`/test/timestamp-demo-ai${usePrerecordedAudio ? "" : "?prerecorded=false"}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View AI Future Demo
                  </Link>
                ) : selectedTimestampDemo === "mindfulness" ? (
                  <Link
                    href={`/test/timestamp-demo-mindfulness${usePrerecordedAudio ? "" : "?prerecorded=false"}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View Mindfulness Demo
                  </Link>
                ) : (
                  <Link
                    href={`/test/timestamp-demo-internet${usePrerecordedAudio ? "" : "?prerecorded=false"}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View Internet History Demo
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
