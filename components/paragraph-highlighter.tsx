"use client"

import { useState, useEffect, useRef } from "react"
import PlayButton from "@/components/play-button"
import ProgressBar from "@/components/progress-bar"
import { detectParagraphs, calculateParagraphTimings } from "@/utils/paragraph-utils"

interface ParagraphHighlighterProps {
  text: string
  title?: string
  audioSrc: string
  onParagraphClick?: (paragraphIndex: number) => void
}

export default function ParagraphHighlighter({ text, title, audioSrc, onParagraphClick }: ParagraphHighlighterProps) {
  const [paragraphs, setParagraphs] = useState<
    Array<{
      text: string
      startTime: number
      endTime: number
    }>
  >([])
  const [activeParagraphIndex, setActiveParagraphIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isAudioReady, setIsAudioReady] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const activeParagraphRef = useRef<HTMLParagraphElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const syncStateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize audio and process paragraphs
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    
    if (!audioSrc || audioSrc.trim() === '') {
      console.error("No audio source provided to ParagraphHighlighter");
      setError("No audio source available");
      return;
    }

    console.log("Initializing ParagraphHighlighter with text length:", text.length);
    console.log("Audio source:", audioSrc);

    // Detect paragraphs
    const detectedParagraphs = detectParagraphs(text);
    console.log(`Detected ${detectedParagraphs.length} paragraphs`);

    // Clean up any existing audio and timeouts
    let isMounted = true;
    const cleanup = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      clearProgressInterval();
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      if (syncStateTimeoutRef.current) {
        clearTimeout(syncStateTimeoutRef.current);
        syncStateTimeoutRef.current = null;
      }
    };
    
    // Initial cleanup
    cleanup();

    // Normalize URL to fix any double slashes
    const normalizedAudioSrc = audioSrc.replace(/([^:]\/)\/+/g, "$1");

    // Create audio element
    const audio = new Audio();
    
    // Set up timeout for loading
    loadTimeoutRef.current = setTimeout(() => {
      if (isMounted) {
        console.warn("Audio loading timeout in ParagraphHighlighter");
        setError("Audio is taking too long to load. It may be unavailable.");
        setIsAudioReady(false);
      }
    }, 10000);

    // Set up audio event listeners before setting the source
    audio.addEventListener("loadedmetadata", () => {
      if (!isMounted) return;
      
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      
      console.log("Audio metadata loaded, duration:", audio.duration);
      setDuration(audio.duration);
      setIsAudioReady(true);

      // Calculate paragraph timings
      const timedParagraphs = calculateParagraphTimings(detectedParagraphs, audio.duration);
      setParagraphs(timedParagraphs);
    });

    audio.addEventListener("canplaythrough", () => {
      if (!isMounted) return;
      
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      
      console.log("Audio can play through without buffering");
      setIsAudioReady(true);
    });

    audio.addEventListener("ended", () => {
      if (!isMounted) return;
      console.log("Audio ended event fired");
      setIsPlaying(false);
      clearProgressInterval();
    });

    // Add playing event listener to sync state when playback starts
    audio.addEventListener("playing", () => {
      if (!isMounted) return;
      console.log("Audio playing event fired - syncing UI state");
      setIsPlaying(true);
      startProgressInterval();
    });

    // Add pause event listener to sync state when playback pauses
    audio.addEventListener("pause", () => {
      if (!isMounted) return;
      console.log("Audio pause event fired - syncing UI state");
      setIsPlaying(false);
      clearProgressInterval();
    });

    audio.addEventListener("error", () => {
      if (!isMounted) return;
      
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      
      // Safe error handling that doesn't access MediaError properties directly
      console.error("Audio error in ParagraphHighlighter");
      
      // Check if the src was empty
      if (!normalizedAudioSrc || normalizedAudioSrc.trim() === '') {
        setError("Audio error: Empty source URL");
      } else {
        setError("Failed to load audio. The file may be unavailable or in an unsupported format.");
      }
      
      setIsAudioReady(false);
    });

    // Now set the source and load the audio
    try {
      audio.crossOrigin = "anonymous";
      audio.preload = "auto";
      audio.src = normalizedAudioSrc;
      audioRef.current = audio;
      audio.load();
      console.log("Audio loading started with source:", normalizedAudioSrc);
      
      // Set up periodic state check to ensure UI stays in sync with actual audio state
      const startStateSync = () => {
        if (syncStateTimeoutRef.current) {
          clearTimeout(syncStateTimeoutRef.current);
        }
        
        const syncState = () => {
          if (!isMounted || !audioRef.current) return;
          
          // Check if our UI state matches the actual audio element state
          const audioIsActuallyPlaying = !audioRef.current.paused && !audioRef.current.ended && audioRef.current.readyState > 2;
          
          if (isPlaying !== audioIsActuallyPlaying) {
            console.log(`State sync: fixing mismatch - UI state: ${isPlaying ? 'playing' : 'paused'}, actual audio: ${audioIsActuallyPlaying ? 'playing' : 'paused'}`);
            setIsPlaying(audioIsActuallyPlaying);
            
            // If audio is playing but our progress interval isn't running, restart it
            if (audioIsActuallyPlaying && !progressIntervalRef.current) {
              startProgressInterval();
            } else if (!audioIsActuallyPlaying && progressIntervalRef.current) {
              clearProgressInterval();
            }
          }
          
          // Continue checking periodically
          syncStateTimeoutRef.current = setTimeout(syncState, 1000);
        };
        
        // Start the sync cycle
        syncState();
      };
      
      startStateSync();
    } catch (err) {
      console.error("Error setting audio source:", err);
      setError(`Failed to set audio source: ${err instanceof Error ? err.message : "Unknown error"}`);
      setIsAudioReady(false);
    }

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [text, audioSrc]);

  // Start progress tracking interval
  const startProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (!audioRef.current || !isPlaying) return;

      // Update progress percentage
      const currentProgress = (audioRef.current.currentTime / duration) * 100;
      setProgress(currentProgress);

      // Update active paragraph based on current time
      updateActiveParagraph(audioRef.current.currentTime);
    }, 50); // Update every 50ms for smooth tracking
  };

  // Clear progress interval
  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Update active paragraph based on current time
  const updateActiveParagraph = (currentTime: number) => {
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      if (currentTime >= paragraph.startTime && currentTime < paragraph.endTime) {
        if (i !== activeParagraphIndex) {
          setActiveParagraphIndex(i);
        }
        break;
      }
    }
  };

  // Auto-scroll to keep active paragraph in view
  useEffect(() => {
    if (activeParagraphRef.current && containerRef.current) {
      const container = containerRef.current
      const activeParagraph = activeParagraphRef.current

      // Calculate the position to scroll to
      const paragraphTop = activeParagraph.offsetTop
      const paragraphHeight = activeParagraph.offsetHeight
      const containerHeight = container.clientHeight
      
      // Only scroll if the active paragraph is in the bottom half of the container
      if (paragraphTop > containerHeight / 2) {
        const scrollPosition = paragraphTop - containerHeight / 2 + paragraphHeight / 2

        // Smooth scroll to the position
        container.scrollTo({
          top: scrollPosition,
          behavior: "smooth",
        })
      }
    }
  }, [activeParagraphIndex])

  // Start playback
  const startPlayback = () => {
    if (!audioRef.current || !isAudioReady) {
      setError("Audio is not ready yet. Please wait a moment.");
      return;
    }

    try {
      console.log("Attempting to start audio playback");
      
      // If audio is already playing, don't try to play again
      if (!audioRef.current.paused) {
        console.log("Audio is already playing - no need to call play() again");
        setIsPlaying(true); // Make sure UI is in sync
        return;
      }
      
      audioRef.current
        .play()
        .then(() => {
          console.log("Audio play() promise resolved successfully");
          setIsPlaying(true);
          startProgressInterval();
          setError(null);
        })
        .catch((err) => {
          console.error("Error from audio play() promise:", err);
          
          // Special handling for autoplay blocking
          if (err.name === "NotAllowedError") {
            setError("Autoplay blocked by browser. Please click the play button again.");
          } else {
            setError(`Failed to play audio: ${err.message || "Unknown error"}`);
          }
          
          setIsPlaying(false);
        });
    } catch (err: any) {
      console.error("Exception during audio play() call:", err);
      setError(`Failed to play audio: ${err.message || "Unknown error"}`);
      setIsPlaying(false);
    }
  };

  // Stop playback
  const stopPlayback = () => {
    if (!audioRef.current) {
      console.log("Cannot stop playback - no audio element");
      return;
    }
    
    console.log("Stopping audio playback");
    audioRef.current.pause();
    // We don't set isPlaying to false here because the pause event listener will do that
  };

  // Toggle playback
  const togglePlayback = () => {
    console.log(`Toggle playback requested, current isPlaying state: ${isPlaying}`);
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  // Handle paragraph click
  const handleParagraphClick = (index: number) => {
    if (!audioRef.current || !isAudioReady) {
      setError("Audio is not ready yet. Please wait a moment.");
      return;
    }

    setActiveParagraphIndex(index);

    if (onParagraphClick) {
      onParagraphClick(index);
    }

    // Jump to paragraph start time
    const startTime = paragraphs[index].startTime;
    audioRef.current.currentTime = startTime;

    // If not playing, start playback
    if (!isPlaying) {
      startPlayback();
    }
  };

  // Handle seek on progress bar
  const handleSeek = (position: number) => {
    if (!audioRef.current || !duration || !isAudioReady) return;

    // Calculate time from position percentage
    const seekTime = (position / 100) * duration;
    audioRef.current.currentTime = seekTime;

    // Update active paragraph
    updateActiveParagraph(seekTime);

    // If not playing, start playback
    if (!isPlaying) {
      startPlayback();
    }
  };

  return (
    <div className="flex flex-col h-full relative" onClick={togglePlayback}>
      {/* Title section - more compact */}
      {title && (
        <div className="px-6 py-4 mb-0 flex justify-center">
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
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#3b82f6] to-transparent z-10 pointer-events-none"></div>

        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#3b82f6] to-transparent z-10 pointer-events-none"></div>

        <div
          ref={containerRef}
          className="text-left w-full h-full overflow-y-auto scrollbar-hide px-6 flex justify-center"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="py-[20vh] max-w-2xl w-full">
            {/* Render paragraphs */}
            <div className="space-y-8">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  ref={index === activeParagraphIndex ? activeParagraphRef : null}
                  className={`text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight cursor-pointer transition-colors duration-300 ${
                    index === activeParagraphIndex
                      ? "text-white"
                      : index < activeParagraphIndex
                        ? "text-white/60"
                        : "text-white/30"
                  }`}
                  onClick={() => handleParagraphClick(index)}
                >
                  {paragraph.text}
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

        {/* Progress bar */}
        <ProgressBar progress={progress} onSeek={handleSeek} />
      </div>
    </div>
  );
}
