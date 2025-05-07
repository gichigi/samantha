"use client"

import { useState, useEffect, useRef } from "react"
import { getOpenAITTSService } from "@/services/openai-tts-service"
import PlayButton from "@/components/play-button"
import ProgressBar from "@/components/progress-bar"

interface SentenceHighlighterHiFiProps {
  text: string
  onSentenceClick?: (sentenceIndex: number) => void
}

export default function SentenceHighlighterHiFi({ text, onSentenceClick }: SentenceHighlighterHiFiProps) {
  const [paragraphs, setParagraphs] = useState<string[][]>([])
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeSentenceRef = useRef<HTMLSpanElement>(null)
  const ttsServiceRef = useRef<ReturnType<typeof getOpenAITTSService> | null>(null)
  const wordToSentenceMapRef = useRef<number[]>([])
  const totalWordsRef = useRef(0)
  const totalSentencesRef = useRef(0)
  const flatSentencesRef = useRef<string[]>([])

  // Parse text into paragraphs and sentences on load
  useEffect(() => {
    // Split text into paragraphs first
    const textParagraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)

    // Process each paragraph to extract sentences
    const processedParagraphs: string[][] = []
    let allSentences: string[] = []
    const sentenceIndex = 0

    textParagraphs.forEach((paragraph) => {
      // More sophisticated sentence splitting with handling for common abbreviations
      const preprocessed = paragraph
        .replace(/Mr\./g, "Mr_DOT_")
        .replace(/Mrs\./g, "Mrs_DOT_")
        .replace(/Dr\./g, "Dr_DOT_")
        .replace(/Ms\./g, "Ms_DOT_")
        .replace(/Prof\./g, "Prof_DOT_")
        .replace(/Inc\./g, "Inc_DOT_")
        .replace(/Ltd\./g, "Ltd_DOT_")
        .replace(/i\.e\./g, "i_DOT_e_DOT_")
        .replace(/e\.g\./g, "e_DOT_g_DOT_")

      // Split into sentences
      const sentenceRegex = /(?<=[.!?])\s+(?=[A-Z])|(?<=[.!?])\s*$/g
      const sentences = preprocessed
        .split(sentenceRegex)
        .map((sentence) =>
          sentence
            .replace(/Mr_DOT_/g, "Mr.")
            .replace(/Mrs_DOT_/g, "Mrs.")
            .replace(/Dr_DOT_/g, "Dr.")
            .replace(/Ms_DOT_/g, "Ms.")
            .replace(/Prof_DOT_/g, "Prof.")
            .replace(/Inc_DOT_/g, "Inc.")
            .replace(/Ltd_DOT_/g, "Ltd.")
            .replace(/i_DOT_e_DOT_/g, "i.e.")
            .replace(/e_DOT_g_DOT_/g, "e.g."),
        )
        .filter((sentence) => sentence.trim().length > 0)

      processedParagraphs.push(sentences)
      allSentences = [...allSentences, ...sentences]
    })

    setParagraphs(processedParagraphs)
    flatSentencesRef.current = allSentences
    totalSentencesRef.current = allSentences.length

    // Create a mapping from word index to sentence index
    const wordToSentenceMap: number[] = []
    let totalWords = 0

    allSentences.forEach((sentence, sentenceIndex) => {
      const wordCount = sentence.split(/\s+/).length
      for (let i = 0; i < wordCount; i++) {
        wordToSentenceMap.push(sentenceIndex)
      }
      totalWords += wordCount
    })

    wordToSentenceMapRef.current = wordToSentenceMap
    totalWordsRef.current = totalWords

    // Initialize TTS service
    ttsServiceRef.current = getOpenAITTSService()
  }, [text])

  // Auto-scroll to keep active sentence in view
  useEffect(() => {
    if (activeSentenceRef.current && containerRef.current) {
      const container = containerRef.current
      const activeSentence = activeSentenceRef.current

      // Calculate the position to scroll to (sentence position - half of container height + half of sentence height)
      const sentenceTop = activeSentence.offsetTop
      const sentenceHeight = activeSentence.offsetHeight
      const containerHeight = container.clientHeight
      const scrollPosition = sentenceTop - containerHeight / 2 + sentenceHeight / 2

      // Smooth scroll to the position
      container.scrollTo({
        top: scrollPosition,
        behavior: "smooth",
      })
    }
  }, [activeSentenceIndex])

  // Handle TTS word change to update active sentence
  const handleWordChange = (wordIndex: number) => {
    if (wordToSentenceMapRef.current.length > wordIndex) {
      const sentenceIndex = wordToSentenceMapRef.current[wordIndex]
      setActiveSentenceIndex(sentenceIndex)

      // Update progress
      const progress = (wordIndex / totalWordsRef.current) * 100
      setProgress(progress)
    }
  }

  // Start playback
  const startPlayback = () => {
    if (!ttsServiceRef.current) return

    ttsServiceRef.current.setCallbacks(
      handleWordChange,
      () => setIsPlaying(false),
      () => setError("Autoplay is blocked by your browser. Please click the play button to start."),
      undefined,
    )

    ttsServiceRef.current
      .prepare(text, { skipPreprocessing: true })
      .then(() => {
        ttsServiceRef.current?.speak(0)
        setIsPlaying(true)
        setError(null)
      })
      .catch((err) => {
        console.error("Error preparing TTS:", err)
        setError(`Failed to prepare audio: ${err.message || "Unknown error"}`)
      })
  }

  // Stop playback
  const stopPlayback = () => {
    if (!ttsServiceRef.current) return
    ttsServiceRef.current.pause()
    setIsPlaying(false)
  }

  // Toggle playback
  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback()
    } else {
      startPlayback()
    }
  }

  // Handle sentence click
  const handleSentenceClick = (index: number) => {
    setActiveSentenceIndex(index)

    if (onSentenceClick) {
      onSentenceClick(index)
    }

    // Find the first word index for this sentence
    const firstWordIndex = wordToSentenceMapRef.current.findIndex((sentenceIndex) => sentenceIndex === index)

    if (firstWordIndex >= 0 && ttsServiceRef.current) {
      ttsServiceRef.current.stop()
      setTimeout(() => {
        ttsServiceRef.current?.speak(firstWordIndex)
        setIsPlaying(true)
        setError(null)
      }, 50)
    }
  }

  // Handle seek on progress bar
  const handleSeek = (position: number) => {
    // Calculate the word index based on position
    const wordIndex = Math.floor((position * totalWordsRef.current) / 100)

    // Find the sentence for this word
    if (wordToSentenceMapRef.current.length > wordIndex) {
      const sentenceIndex = wordToSentenceMapRef.current[wordIndex]
      setActiveSentenceIndex(sentenceIndex)

      // Start playback from this word
      if (ttsServiceRef.current) {
        ttsServiceRef.current.stop()
        setTimeout(() => {
          ttsServiceRef.current?.speak(wordIndex)
          setIsPlaying(true)
          setError(null)
        }, 50)
      }
    }
  }

  // Find global sentence index within paragraphs
  const findSentenceInfo = (globalIndex: number) => {
    let currentIndex = 0
    for (let p = 0; p < paragraphs.length; p++) {
      for (let s = 0; s < paragraphs[p].length; s++) {
        if (currentIndex === globalIndex) {
          return { paragraphIndex: p, sentenceIndex: s }
        }
        currentIndex++
      }
    }
    return { paragraphIndex: 0, sentenceIndex: 0 }
  }

  return (
    <div className="flex flex-col h-full relative" onClick={togglePlayback}>
      {/* Main text display with gradient fades */}
      <div className="relative w-full h-[85vh]">
        {/* Top fade gradient */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#3b82f6] to-transparent z-10 pointer-events-none"></div>

        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#3b82f6] to-transparent z-10 pointer-events-none"></div>

        <div
          ref={containerRef}
          className="text-left w-full h-full overflow-y-auto scrollbar-hide px-6"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="py-[40vh]">
            {/* Render paragraphs with proper spacing */}
            <div className="space-y-8">
              {paragraphs.map((sentences, paragraphIndex) => (
                <p
                  key={paragraphIndex}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
                >
                  {sentences.map((sentence, sentenceIndexInParagraph) => {
                    // Calculate the global sentence index
                    let globalSentenceIndex = 0
                    for (let p = 0; p < paragraphIndex; p++) {
                      globalSentenceIndex += paragraphs[p].length
                    }
                    globalSentenceIndex += sentenceIndexInParagraph

                    return (
                      <span
                        key={`${paragraphIndex}-${sentenceIndexInParagraph}`}
                        ref={globalSentenceIndex === activeSentenceIndex ? activeSentenceRef : null}
                        onClick={(e) => {
                          // Fix: Check if e exists before calling stopPropagation
                          if (e) {
                            e.stopPropagation()
                          }
                          handleSentenceClick(globalSentenceIndex)

                          // Visual feedback when tapping a sentence
                          if (e) {
                            const target = e.target as HTMLElement
                            target.classList.add("tap-animation")
                            setTimeout(() => {
                              target.classList.remove("tap-animation")
                            }, 300)
                          }
                        }}
                        className={`inline cursor-pointer transition-colors duration-300 rounded-sm ${
                          globalSentenceIndex === activeSentenceIndex
                            ? "text-white"
                            : globalSentenceIndex < activeSentenceIndex
                              ? "text-white/60"
                              : "text-white/30"
                        }`}
                      >
                        {sentence}{" "}
                      </span>
                    )
                  })}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white bg-red-500/20 p-4 rounded-lg max-w-md text-center z-30">
          <p className="font-semibold">Error</p>
          <p className="font-normal">{error}</p>
        </div>
      )}

      {/* Fixed footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        {/* Play button */}
        <div className="flex justify-center pb-8 pt-4">
          <PlayButton isPlaying={isPlaying} onClick={() => togglePlayback()} />
        </div>

        {/* Progress bar at the very bottom */}
        <ProgressBar progress={progress} onSeek={handleSeek} />
      </div>
    </div>
  )
}
