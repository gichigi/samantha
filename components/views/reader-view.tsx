"use client"

import { useState, useEffect } from "react"
import AudioController from "@/components/audio-controls/audio-controller"
import AudioVisualizer from "@/components/audio-visualizer"
import { useReader } from "@/contexts/reader-context"
import { useViewState } from "@/hooks/use-view-state"
import { useAudioPlayer } from "@/hooks/use-audio-player"
import { getTTSService } from "@/services/tts-service"

export default function ReaderView() {
  const {
    currentTextIndex,
    currentTitle,
    currentUrl,
    audioUrl,
    currentText,
    processedText,
    useTimestampHighlighting,
    trackReading,
    wordCount,
  } = useReader()

  const { transitionTo, isFadingOut, isFadingIn } = useViewState()
  const [error, setError] = useState<string | null>(null)
  const [ttsSupported, setTTSSupported] = useState(true)

  // Set up audio player
  const {
    isPlaying,
    progress,
    isReady,
    error: audioError,
    autoplayBlocked,
    selectedVoice,
    duration,
    currentTime,
    play,
    pause,
    toggle,
    seek,
    skipForward,
    skipBackward,
    setVoiceInfo,
  } = useAudioPlayer({
    audioUrl,
    onTimeUpdate: (currentTime) => {
      // Time updates handled by audio visualizer
    },
    onEnded: () => {
      // Track completed reading when finished
      if (currentUrl) {
        trackReading(currentUrl, currentTitle, wordCount)
      }
    },
  })

  // Initialize TTS service and check compatibility
  useEffect(() => {
    const tts = getTTSService()
    
    // Check if TTS is supported
    const isSupported = tts.isFeatureSupported()
    setTTSSupported(isSupported)
    
    if (!isSupported) {
      setError("Text-to-speech is not supported in this browser. Try Chrome, Edge, or Safari.")
    }
    
    // Set up error callback
    tts.setCallbacks(
      // Word change callback
      (index) => {
        // This is handled by highlighter components
      },
      // Finish callback
      () => {
        if (currentUrl) {
          trackReading(currentUrl, currentTitle, wordCount)
        }
      },
      // Error callback
      (errorMsg) => {
        setError(errorMsg)
      },
      // Voice selected callback
      (voice) => {
        if (voice) {
          setVoiceInfo(voice.name, voice.lang)
        } else {
          setVoiceInfo(null)
        }
      }
    )
    
    // Note: Removed browser TTS voice check since we use OpenAI TTS API
    // which doesn't require browser voices
  }, [currentUrl, currentTitle, wordCount, useTimestampHighlighting, audioUrl])


  // Handle audio errors
  useEffect(() => {
    if (audioError) {
      setError(audioError)
    }
  }, [audioError])

  // Clean up audio loading if component unmounts during loading
  useEffect(() => {
    return () => {
      // Call the cleanup function if it exists
      if (window.__audioCleanup) {
        window.__audioCleanup();
        window.__audioCleanup = undefined;
      }
    };
  }, []);

  // Setup nav context 
  useEffect(() => {
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
  }, []);

  const goToHomeScreen = () => {
    // Stop any playing audio
    if (isPlaying) {
      pause()
    }

    // Transition back to home screen with fade effect
    transitionTo("home", true)
  }

  const handleTogglePlay = () => {
    toggle()
  }

  const handleSeek = (position: number) => {
    seek(position)
  }

  const handleRetry = () => {
    setError(null)
    play()
  }

  const handleSkipForward = () => {
    skipForward(10)
  }

  const handleSkipBackward = () => {
    skipBackward(10)
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
        {/* Article title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-white mb-12 text-center px-6 max-w-4xl">
          {currentTitle}
        </h1>
        
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
        voiceInfo={selectedVoice}
        isSupported={ttsSupported}
        autoplayBlocked={autoplayBlocked}
        onRetry={handleRetry}
      />
      </main>
    </>
  )
}
