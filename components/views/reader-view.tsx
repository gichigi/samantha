"use client"

import { useState, useEffect, useRef } from "react"
import AudioController from "@/components/audio-controls/audio-controller"
import AudioVisualizer from "@/components/audio-visualizer"
import { useReader } from "@/contexts/reader-context"
import { useViewState } from "@/hooks/use-view-state"
import { getOpenAITTSService } from "@/services/openai-tts-service"

export default function ReaderView() {
  const {
    currentTitle,
    currentByline,
    currentUrl,
    audioUrl,
    wordCount,
  } = useReader()

  const { transitionTo, isFadingOut, isFadingIn } = useViewState()
  
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  
  const ttsServiceRef = useRef(getOpenAITTSService())
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioInitializedRef = useRef<string | null>(null)

  // Initialize TTS service with audio URL
  useEffect(() => {
    if (!audioUrl || audioInitializedRef.current === audioUrl) return

    const ttsService = ttsServiceRef.current
    
    // Audio should already be prepared from LoadingView
    const url = ttsService.getAudioUrl()
    if (url === audioUrl) {
      setIsReady(true)
      audioInitializedRef.current = audioUrl
      console.log("Audio ready for playback")
    } else {
      console.error("Audio URL mismatch")
      setError("Audio not ready")
    }
  }, [audioUrl])

  // Track progress while playing
  useEffect(() => {
    if (!isPlaying) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      return
    }

    // Update progress every 50ms while playing
    progressIntervalRef.current = setInterval(() => {
      const ttsService = ttsServiceRef.current
      
      if (!ttsService.isPaused()) {
        const time = ttsService.getCurrentTime()
        const dur = ttsService.getDuration()
        
        setCurrentTime(time)
        setDuration(dur)
        
        if (dur > 0) {
          const progressPercent = (time / dur) * 100
          setProgress(progressPercent)
        }
      }
    }, 50)

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [isPlaying])

  // Set up TTS callbacks
  useEffect(() => {
    const ttsService = ttsServiceRef.current
    
    ttsService.setCallbacks(
      () => {}, // Word change - not needed for now
      () => {
        // Audio finished playing
        setIsPlaying(false)
      },
      () => {
        // Autoplay blocked
        setAutoplayBlocked(true)
        setIsPlaying(false)
      }
    )

    return () => {
      // Cleanup on unmount
      ttsService.stop()
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [currentUrl, currentTitle, wordCount])

  // Setup nav context 
  useEffect(() => {
    const goToHomeScreen = () => {
      // Stop any playing audio
      const ttsService = ttsServiceRef.current
      if (isPlaying) {
        ttsService.pause()
        setIsPlaying(false)
      }

      // Transition back to home screen with fade effect
      transitionTo("home", true)
    }

    // Set back button handler in the navbar via custom event
    const setBackHandler = new CustomEvent('setBackHandler', { 
      detail: { handler: goToHomeScreen }
    });
    window.dispatchEvent(setBackHandler);
    
    return () => {
      // Clear back handler when component unmounts
      const clearBackHandler = new CustomEvent('clearBackHandler');
      window.dispatchEvent(clearBackHandler);
    };
  }, [isPlaying, transitionTo]);

  const goToHomeScreen = () => {
    // Stop any playing audio
    const ttsService = ttsServiceRef.current
    if (isPlaying) {
      ttsService.pause()
      setIsPlaying(false)
    }

    // Transition back to home screen with fade effect
    transitionTo("home", true)
  }

  const handleTogglePlay = () => {
    const ttsService = ttsServiceRef.current
    
    if (isPlaying) {
      ttsService.pause()
      setIsPlaying(false)
    } else {
      // Resume from current position
      ttsService.resume()
      setIsPlaying(true)
      setError(null)
    }
  }

  const handleSeek = (position: number) => {
    const ttsService = ttsServiceRef.current
    const dur = ttsService.getDuration()
    
    if (dur > 0) {
      const seekTime = (position / 100) * dur
      ttsService.setCurrentTime(seekTime)
      setCurrentTime(seekTime)
      setProgress(position)
    }
  }

  const handleRetry = async () => {
    setError(null)
    setAutoplayBlocked(false)
    
    try {
      const ttsService = ttsServiceRef.current
      await ttsService.speak()
      setIsPlaying(true)
    } catch (err) {
      console.error("Retry playback error:", err)
      setError("Failed to play audio")
    }
  }

  const handleSkipForward = () => {
    const ttsService = ttsServiceRef.current
    const dur = ttsService.getDuration()
    const currentTime = ttsService.getCurrentTime()
    
    if (dur > 0) {
      const newTime = Math.min(currentTime + 10, dur)
      ttsService.setCurrentTime(newTime)
      setCurrentTime(newTime)
    }
  }

  const handleSkipBackward = () => {
    const ttsService = ttsServiceRef.current
    const currentTime = ttsService.getCurrentTime()
    
    const newTime = Math.max(currentTime - 10, 0)
    ttsService.setCurrentTime(newTime)
    setCurrentTime(newTime)
  }

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <main
        className={`flex min-h-screen flex-col bg-[#3b82f6] relative transition-opacity duration-500 ${
          isFadingOut ? "opacity-0" : isFadingIn ? "opacity-0" : "opacity-100"
        }`}
        style={{
          animation: isFadingIn ? "fadeIn 0.5s ease-in-out forwards" : undefined
        }}
      >
      {/* Back button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={goToHomeScreen}
          className="rounded-full bg-white/10 hover:bg-white/20 p-2 transition-colors"
          aria-label="Go back to home"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-white"
          >
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      </div>
      
      {/* Main content - audio-first design */}
      <div className="flex-1 flex flex-col items-center justify-center pt-16 pb-32">
        {/* Article title and byline */}
        <div className="text-center px-6 max-w-4xl mb-12">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-wide">
            {currentTitle}
          </h1>
          {currentByline && (
            <p className="text-white/70 text-sm md:text-base mt-2 font-light">
              {currentByline}
            </p>
          )}
        </div>
        
        {/* Audio visualizer */}
        <AudioVisualizer
          isLoading={!isReady}
          isPlaying={isPlaying}
          audioDuration={duration}
          currentTime={currentTime}
        />
      </div>

      {/* Audio controls - always visible but disabled when not ready */}
      <AudioController
        isPlaying={isPlaying}
        progress={progress}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onSkipForward={handleSkipForward}
        onSkipBackward={handleSkipBackward}
        visible={true}
        error={error}
        voiceInfo={null}
        isSupported={true}
        autoplayBlocked={autoplayBlocked}
        onRetry={handleRetry}
      />
      </main>
    </>
  )
}
