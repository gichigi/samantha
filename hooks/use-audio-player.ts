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

    // Keep track of component mounted state
    let isMounted = true;

    // Clean up any existing audio element
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }

    // Create timeout for loading detection
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn("Audio loading timeout in useAudioPlayer");
        setError("Audio is taking too long to load");
        setIsReady(false);
      }
    }, 20000); // 20 second timeout
    
    // Normalize URL to fix any double slashes
    const normalizedUrl = audioUrl.replace(/([^:]\/)\/+/g, "$1");
    
    // Use document.createElement for better browser compatibility
    const audio = document.createElement('audio');
    audioRef.current = audio;

    // Set properties for better cross-browser support
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";

    // Set up event handlers using on* properties for better compatibility
    audio.onloadedmetadata = () => {
      if (!isMounted) return;
      
      clearTimeout(timeoutId);
      setDuration(audio.duration);
      setIsReady(true);
      console.log(`Audio loaded: ${normalizedUrl} (duration: ${audio.duration}s)`);
    };

    audio.oncanplaythrough = () => {
      if (!isMounted) return;
      
      console.log("Audio can play through without buffering");
    };

    audio.onended = () => {
      if (!isMounted) return;
      
      setIsPlaying(false);
      clearProgressInterval();
      if (onEnded) onEnded();
    };

    // Simple error handler that doesn't access MediaError properties
    audio.onerror = () => {
      if (!isMounted) return;
      
      clearTimeout(timeoutId);
      
      // Just log an error occurred without trying to access properties
      console.error("Audio error:", {
        message: "Failed to load audio file",
        url: normalizedUrl
      });
      
      setError("Failed to load audio file");
      setIsReady(false);
    };

    // Load the audio
    try {
      audio.src = normalizedUrl;
      audio.load();
    } catch (e) {
      console.error("Exception during audio loading:", e);
      setError("Error starting audio playback");
    }

    return () => {
      // Mark component as unmounted
      isMounted = false;
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Clean up audio element
      if (audioRef.current) {
        // Remove event handlers to prevent memory leaks
        audioRef.current.onloadedmetadata = null;
        audioRef.current.oncanplaythrough = null;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      
      clearProgressInterval();
    };
  }, [audioUrl, onEnded]);

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

      try {
      await audioRef.current.play()
      setIsPlaying(true)
      startProgressInterval()
        
        // If play succeeded, reset any autoplay blocked state
        if (autoplayBlocked) {
          setAutoplayBlocked(false)
        }
        
      setError(null)
      } catch (playError) {
        // Handle play errors without accessing error properties directly
        console.error("Play error:", playError instanceof Error ? playError.message : "Unknown play error");
        
        // Try to determine if this is an autoplay blocking error
        if (playError instanceof Error && playError.name === 'NotAllowedError') {
          setAutoplayBlocked(true)
          console.warn("Autoplay blocked by browser policy")
        } else {
          setError("Failed to play audio. Try interacting with the page first.")
        }
        
        setIsPlaying(false)
      }
    } catch (err) {
      // Handle errors in the outer try block
      console.error("General play error:", err);
      setError("An error occurred while trying to play audio")
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
