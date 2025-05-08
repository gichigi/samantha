"use client"

import { useState, useEffect, useRef } from "react"
import { getOpenAITTSService } from "@/services/openai-tts-service"
import PlayButton from "@/components/play-button"
import ProgressBar from "@/components/progress-bar"

interface SentenceHighlighterProps {
  text: string
  title?: string
  onSentenceClick?: (sentenceIndex: number) => void
}

export default function SentenceHighlighter({ text, title, onSentenceClick }: SentenceHighlighterProps) {
  const [sentences, setSentences] = useState<string[]>([])
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeSentenceRef = useRef<HTMLParagraphElement>(null)
  const ttsServiceRef = useRef<ReturnType<typeof getOpenAITTSService> | null>(null)
  const wordToSentenceMapRef = useRef<number[]>([])
  const flatSentencesRef = useRef<string[]>([])
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const totalWordsRef = useRef(0)

  // Parse text into sentences on load
  useEffect(() => {
    // Split text into paragraphs first
    const textParagraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)

    // Process each paragraph to extract sentences
    let allSentences: string[] = []

    textParagraphs.forEach((paragraph) => {
      // Simple sentence splitting
      const paragraphSentences = paragraph.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.trim().length > 0)
      allSentences = [...allSentences, ...paragraphSentences]
    })

    setSentences(allSentences)
    flatSentencesRef.current = allSentences

    // Create a mapping from word index to sentence index
    const wordToSentenceMap: number[] = []
    let totalWords = 0;
    
    allSentences.forEach((sentence, sentenceIndex) => {
      const words = sentence.split(/\s+/).filter(w => w.trim().length > 0);
      totalWords += words.length;
      
      for (let i = 0; i < words.length; i++) {
        wordToSentenceMap.push(sentenceIndex)
      }
    })

    wordToSentenceMapRef.current = wordToSentenceMap
    totalWordsRef.current = totalWords;

    // Initialize TTS service
    ttsServiceRef.current = getOpenAITTSService()
    
    // Clean up on unmount
    return () => {
      clearProgressInterval();
      if (ttsServiceRef.current) {
        ttsServiceRef.current.stop();
      }
    };
  }, [text])

  // Auto-scroll to keep active sentence in view
  useEffect(() => {
    if (activeSentenceRef.current && containerRef.current) {
      const container = containerRef.current
      const activeSentence = activeSentenceRef.current

      // Calculate the position to scroll to
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

  // Start progress tracking interval
  const startProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    progressIntervalRef.current = setInterval(() => {
      if (!ttsServiceRef.current || !isPlaying) return

      const currentWordIndex = ttsServiceRef.current.getCurrentWordIndex?.() || 0;
      if (currentWordIndex >= 0 && totalWordsRef.current > 0) {
        const progressPercent = (currentWordIndex / totalWordsRef.current) * 100;
        setProgress(progressPercent);
      }
    }, 50)
  }

  // Clear progress interval
  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  // Handle TTS word change to update active sentence
  const handleWordChange = (wordIndex: number) => {
    if (wordToSentenceMapRef.current.length > wordIndex) {
      const sentenceIndex = wordToSentenceMapRef.current[wordIndex]
      setActiveSentenceIndex(sentenceIndex)
    }
  }

  // Start playback
  const startPlayback = () => {
    if (!ttsServiceRef.current) {
      setError("TTS service not initialized");
      return;
    }

    ttsServiceRef.current.setCallbacks(
      handleWordChange, 
      () => {
        setIsPlaying(false);
        clearProgressInterval();
      }, 
      (err) => setError(err),
      undefined
    );

    ttsServiceRef.current
      .prepare(text, { skipPreprocessing: true })
      .then(() => {
        ttsServiceRef.current?.speak(0)
        setIsPlaying(true)
        startProgressInterval();
        setError(null);
      })
      .catch((err) => {
        console.error("Error preparing TTS:", err)
        setError(`Error preparing audio: ${err.message || "Unknown error"}`);
      })
  }

  // Stop playback
  const stopPlayback = () => {
    if (!ttsServiceRef.current) return
    ttsServiceRef.current.pause()
    setIsPlaying(false)
    clearProgressInterval();
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
        startProgressInterval();
        setError(null);
      }, 50)
    }
  }

  // Handle seek on progress bar
  const handleSeek = (position: number) => {
    // Calculate the word index based on position
    const wordIndex = Math.floor((position * totalWordsRef.current) / 100);

    // Find the sentence for this word
    if (wordToSentenceMapRef.current.length > wordIndex) {
      const sentenceIndex = wordToSentenceMapRef.current[wordIndex];
      setActiveSentenceIndex(sentenceIndex);

      // Start playback from this word
      if (ttsServiceRef.current) {
        ttsServiceRef.current.stop();
        setTimeout(() => {
          ttsServiceRef.current?.speak(wordIndex);
          setIsPlaying(true);
          startProgressInterval();
          setError(null);
        }, 50);
      }
    }
  };

  return (
    <div className="flex flex-col h-full relative" onClick={togglePlayback}>
      {/* Title section - more compact */}
      {title && (
        <div className="px-6 py-4 mb-2 flex justify-center">
          <div className="max-w-2xl w-full">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight text-white text-center">
              {title}
            </h1>
            <div className="mt-2 h-0.5 w-16 bg-white/60 mx-auto rounded-full"></div>
          </div>
        </div>
      )}

      {/* Main text display with gradient fades */}
      <div className="relative w-full h-[85vh]">
        {/* Top fade gradient - reduced height */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#3b82f6] to-transparent z-10 pointer-events-none"></div>

        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#3b82f6] to-transparent z-10 pointer-events-none"></div>

        <div
          ref={containerRef}
          className="text-left w-full h-full overflow-y-auto scrollbar-hide px-6 flex justify-center"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="py-[40vh] max-w-2xl w-full">
            {/* Render each sentence as its own paragraph */}
          <div className="space-y-6">
              {sentences.map((sentence, index) => (
                <p
                  key={index}
                  ref={index === activeSentenceIndex ? activeSentenceRef : null}
                  onClick={(e) => {
                    if (e) {
                      e.stopPropagation();
                    }
                    handleSentenceClick(index);
                    
                    // Visual feedback when tapping a sentence
                    if (e) {
                      const target = e.target as HTMLElement;
                      target.classList.add("tap-animation");
                      setTimeout(() => {
                        target.classList.remove("tap-animation");
                      }, 300);
                    }
                  }}
                  className={`text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight cursor-pointer transition-colors duration-300 ${
                    index === activeSentenceIndex
                      ? "text-white"
                      : index < activeSentenceIndex
                        ? "text-white/60"
                        : "text-white/30"
                      }`}
                    >
                  {sentence}
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
          <PlayButton 
            isPlaying={isPlaying} 
            onClick={() => togglePlayback()} 
          />
        </div>

        {/* Progress bar */}
        <ProgressBar progress={progress} onSeek={handleSeek} />
      </div>
    </div>
  )
}
