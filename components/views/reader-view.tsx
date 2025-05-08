"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import TimestampHighlighter from "@/components/timestamp-highlighter"
import ParagraphHighlighter from "@/components/paragraph-highlighter"
import SentenceHighlighter from "@/components/sentence-highlighter"
import AudioController from "@/components/audio-controls/audio-controller"
import { useReader } from "@/contexts/reader-context"
import { useViewState } from "@/hooks/use-view-state"
import { useAudioPlayer } from "@/hooks/use-audio-player"
import { getTTSService } from "@/services/tts-service"
import {
  introductionSegments,
  aiFutureSegments,
  mindfulnessSegments,
  internetHistorySegments,
} from "@/data/segments/index"

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

  const { transitionTo, isFadingOut } = useViewState()
  const [error, setError] = useState<string | null>(null)
  const [displayText, setDisplayText] = useState("")
  const [ttsSupported, setTTSSupported] = useState(true)

  // Set up audio player
  const {
    isPlaying,
    progress,
    isReady,
    error: audioError,
    autoplayBlocked,
    selectedVoice,
    play,
    pause,
    toggle,
    seek,
    setVoiceInfo,
  } = useAudioPlayer({
    audioUrl,
    onTimeUpdate: (currentTime) => {
      // Update active segment/paragraph based on current time
      // This would be handled by the highlighter components
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
    
    // If we're not using a pre-recorded audio, check for TTS voices
    if (!useTimestampHighlighting && !audioUrl) {
      // Get TTS state
      const state = tts.getState()
      if (state.voiceCount === 0 && state.isSupported) {
        setError("No text-to-speech voices available. Speech quality may be affected.")
      }
    }
  }, [currentUrl, currentTitle, wordCount, useTimestampHighlighting, audioUrl])

  // Use the processed text if available, otherwise fall back to current text
  useEffect(() => {
    if (processedText && processedText.trim() !== "") {
      setDisplayText(processedText)
      console.log("Using processed text for display")
    } else if (currentText) {
      setDisplayText(currentText)
      console.log("Using current text for display (processed text not available)")
    }
  }, [processedText, currentText])

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

  // Get the appropriate segments based on the current text index
  const getSegments = () => {
    switch (currentTextIndex) {
      case 0:
        return introductionSegments
      case 1:
        return aiFutureSegments
      case 2:
        return mindfulnessSegments
      case 3:
        return internetHistorySegments
      default:
        return []
    }
  }

  return (
    <main
      className={`flex min-h-screen flex-col bg-[#3b82f6] relative transition-opacity duration-500 ${
        isFadingOut ? "opacity-0" : "opacity-100"
      }`}
      onClick={!useTimestampHighlighting && isReady ? toggle : undefined}
    >
      {/* Main content - no navbar here anymore */}
      <div className="flex-1 pt-16 pb-24">
        {useTimestampHighlighting && audioUrl ? (
          <TimestampHighlighter
            segments={getSegments()}
            audioSrc={audioUrl}
            title={currentTitle}
          />
        ) : audioUrl ? (
          <ParagraphHighlighter
            text={displayText}
            title={currentTitle}
            audioSrc={audioUrl}
            onParagraphClick={(index) => console.log(`Clicked paragraph ${index}`)}
          />
        ) : (
          <SentenceHighlighter
            text={displayText}
            title={currentTitle}
            onSentenceClick={(index) => console.log(`Clicked sentence ${index}`)}
          />
        )}
      </div>

      {/* Audio controls - only show for standard TTS, not for timestamp highlighting */}
      {!useTimestampHighlighting && (
        <AudioController
          isPlaying={isPlaying}
          progress={progress}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
          visible={isReady}
          error={error}
          voiceInfo={selectedVoice}
          isSupported={ttsSupported}
          autoplayBlocked={autoplayBlocked}
          onRetry={handleRetry}
        />
      )}
    </main>
  )
}
