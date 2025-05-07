"use client"

import { useState, useRef, useEffect } from "react"

interface UseAudioPlayerProps {
  audioUrl: string | null
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
}

export function useAudioPlayer({ audioUrl, onTimeUpdate, onEnded }: UseAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<{name: string | null, locale: string | null} | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoplayAttemptedRef = useRef(false)

  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) {
      setIsReady(false)
      return
    }

    // Clean up any existing audio element
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    // Reset state
    setError(null)
    setAutoplayBlocked(false)
    autoplayAttemptedRef.current = false

    // Set up event listeners
    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration)
      setIsReady(true)
      console.log(`Audio loaded: ${audioUrl} (duration: ${audio.duration}s)`)
    })

    audio.addEventListener("canplaythrough", () => {
      console.log("Audio can play through without buffering")
    })

    audio.addEventListener("ended", () => {
      setIsPlaying(false)
      clearProgressInterval()
      if (onEnded) onEnded()
    })

    audio.addEventListener("error", (e) => {
      const errorCode = audio.error ? audio.error.code : 0
      let errorMessage = "Unknown audio error";
      
      // Provide more specific error messages based on the error code
      if (audio.error) {
        switch(errorCode) {
          case 1:
            errorMessage = "Audio loading aborted";
            break;
          case 2:
            errorMessage = "Network error while loading audio";
            break;
          case 3:
            errorMessage = "Audio decoding failed - format may be unsupported";
            break;
          case 4:
            errorMessage = "Audio source not found or access denied";
            break;
          default:
            errorMessage = `Error: ${audio.error.message}`;
        }
      }
      
      console.error("Audio error:", errorMessage, audio.error);
      setError(errorMessage);
      setIsReady(false);
    })

    // Load the audio
    audio.load()

    return () => {
      if (audio) {
        audio.pause()
        audio.src = ""
        clearProgressInterval()
      }
    }
  }, [audioUrl, onEnded])

  // Check if autoplay is supported (to be called before playing)
  const checkAutoplaySupport = async (): Promise<boolean> => {
    try {
      // Create a tiny audio element to test autoplay
      const testAudio = new Audio();
      testAudio.src = "data:audio/mpeg;base64,/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      testAudio.volume = 0.01; // Very low volume
      
      // Try to play it
      await testAudio.play();
      // If we reach here, autoplay is supported
      testAudio.pause();
      return true;
    } catch (err) {
      console.warn("Autoplay may be blocked by browser policy:", err);
      return false;
    }
  };

  // Start progress tracking interval
  const startProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    progressIntervalRef.current = setInterval(() => {
      if (!audioRef.current || !isPlaying) return

      const currentTime = audioRef.current.currentTime
      const progressPercent = (currentTime / duration) * 100
      setProgress(progressPercent)

      if (onTimeUpdate) {
        onTimeUpdate(currentTime)
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

  // Play audio
  const play = async (startTime?: number) => {
    if (!audioRef.current || !isReady) {
      setError("Audio is not ready yet")
      return
    }

    try {
      // If this is the first play attempt, check autoplay support
      if (!autoplayAttemptedRef.current) {
        autoplayAttemptedRef.current = true;
        const canAutoplay = await checkAutoplaySupport();
        
        if (!canAutoplay) {
          setAutoplayBlocked(true);
          // We don't set an error here, just inform the user
          // The audio will still try to play below
          console.warn("Autoplay blocked by browser. User interaction required.");
        }
      }

      if (startTime !== undefined) {
        audioRef.current.currentTime = startTime
      }

      await audioRef.current.play()
      setIsPlaying(true)
      startProgressInterval()
      
      // If play succeeded, reset any autoplay blocked state
      if (autoplayBlocked) {
        setAutoplayBlocked(false)
      }
      
      setError(null)
    } catch (err: any) {
      // Differentiate between autoplay blocking and other errors
      if (err.name === 'NotAllowedError') {
        setAutoplayBlocked(true)
        console.warn("Autoplay blocked:", err)
      } else {
        setError(`Failed to play audio: ${err.message || "Unknown error"}`)
      }
      setIsPlaying(false)
    }
  }

  // Pause audio
  const pause = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    setIsPlaying(false)
    clearProgressInterval()
  }

  // Toggle play/pause
  const toggle = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  // Seek to position
  const seek = (percent: number) => {
    if (!audioRef.current || !isReady) return

    const seekTime = (percent / 100) * duration
    audioRef.current.currentTime = seekTime

    if (!isPlaying) {
      play(seekTime)
    }
  }

  // Set voice info for display
  const setVoiceInfo = (name: string | null, locale: string | null = null) => {
    setSelectedVoice({ name, locale })
  }

  return {
    isPlaying,
    progress,
    duration,
    isReady,
    error,
    autoplayBlocked,
    selectedVoice,
    play,
    pause,
    toggle,
    seek,
    setVoiceInfo
  }
}
