"use client"

import { useState, useEffect, useRef } from "react"
import PlayButton from "@/components/play-button"
import ProgressBar from "@/components/progress-bar"

interface TimestampedSegment {
  text: string
  startTime: number // in seconds
  endTime?: number // in seconds (optional, will be calculated if not provided)
}

interface TimestampHighlighterProps {
  segments: TimestampedSegment[]
  audioSrc: string
  title?: string
  onSegmentClick?: (segmentIndex: number) => void
}

export default function TimestampHighlighter({ segments, audioSrc, title, onSegmentClick }: TimestampHighlighterProps) {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [isAudioReady, setIsAudioReady] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const activeSegmentRef = useRef<HTMLSpanElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize audio and process segments
  useEffect(() => {
    // Create audio element
    if (typeof window !== "undefined") {
      console.log("Creating audio element with source:", audioSrc);

      // Clean up any existing audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      // Keep track of component mounted state
      let isMounted = true;
      
      // Create a timeout to detect if audio loading takes too long
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          console.warn("Audio loading timeout in TimestampHighlighter");
          setError("Audio is taking too long to load. There might be a network issue.");
        }
      }, 15000); // 15 second timeout

      // Normalize URL to fix any double slashes
      const normalizedSrc = audioSrc.replace(/([^:]\/)\/+/g, "$1");
      
      // Use document.createElement for better browser compatibility
      const audio = document.createElement('audio');
      audioRef.current = audio;
      
      // Set attributes for better cross-browser support
      audio.crossOrigin = "anonymous";
      audio.preload = "auto";

      // Set up audio event handlers using on* properties instead of addEventListener
      // This has better cross-browser compatibility
      
      audio.onloadedmetadata = () => {
        if (!isMounted) return;
        
        clearTimeout(timeoutId);
        console.log("Audio loaded and ready to play");
        setDuration(audio.duration);
        setIsAudioReady(true);

          // Fill in any missing endTime values
        processSegments();
      };

      audio.onended = () => {
        if (!isMounted) return;
        
        setIsPlaying(false);
        clearProgressInterval();
      };

      // Generic error handler that doesn't try to access MediaError properties
      audio.onerror = () => {
        if (!isMounted) return;
        
        clearTimeout(timeoutId);
        
        // Just log the error occurred without trying to inspect the error object
        console.error("Audio failed to load in TimestampHighlighter:", {
          audioSrc: normalizedSrc,
          errorType: "load_failure" 
        });
        
        setError("Unable to load audio file. It may be unavailable or in an unsupported format.");
        setIsPlaying(false);
        setIsAudioReady(false);
      };

      // Set the source and begin loading
      try {
        audio.src = normalizedSrc;
        audio.load();
      } catch (e) {
        console.error("Exception during audio loading:", e);
        setError(`Error loading audio: ${(e as Error)?.message || "Unknown error"}`);
    }

    return () => {
      // Clean up
        isMounted = false;
        clearTimeout(timeoutId);
        
      if (audioRef.current) {
          // Remove event handlers to prevent memory leaks
          audioRef.current.onloadedmetadata = null;
          audioRef.current.onended = null;
          audioRef.current.onerror = null;
          
          audioRef.current.pause();
          audioRef.current.src = "";
      }
        
        clearProgressInterval();
      };
    }
  }, [audioSrc]);

  // Process segments to ensure all have endTime values
  const processSegments = () => {
    if (!audioRef.current) return

    const totalDuration = audioRef.current.duration
    console.log("Processing segments with total duration:", totalDuration)

    // Fill in missing endTime values
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].endTime === undefined) {
        if (i < segments.length - 1) {
          // If not the last segment, end time is the start time of the next segment
          segments[i].endTime = segments[i + 1].startTime
        } else {
          // If last segment, end time is the total duration
          segments[i].endTime = totalDuration
        }
      }
    }
  }

  // Auto-scroll to keep active segment in view
  useEffect(() => {
    if (activeSegmentRef.current && containerRef.current) {
      const container = containerRef.current
      const activeSegment = activeSegmentRef.current

      // Calculate the position to scroll to
      const segmentTop = activeSegment.offsetTop
      const segmentHeight = activeSegment.offsetHeight
      const containerHeight = container.clientHeight
      
      // Only scroll if the active segment is in the bottom half of the container
      if (segmentTop > containerHeight / 2) {
        const scrollPosition = segmentTop - containerHeight / 2 + segmentHeight / 2

        // Smooth scroll to the position
        container.scrollTo({
          top: scrollPosition,
          behavior: "smooth",
        })
      }
    }
  }, [activeSegmentIndex])

  // Start progress tracking interval
  const startProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        // Update progress percentage
        const currentProgress = (audioRef.current.currentTime / duration) * 100
        setProgress(currentProgress)

        // Update active segment based on current time
        updateActiveSegment(audioRef.current.currentTime)
      }
    }, 50) // Update every 50ms for smooth tracking
  }

  // Clear progress interval
  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  // Update active segment based on current time
  const updateActiveSegment = (currentTime: number) => {
    // Add a slight delay (0.3 seconds) to the highlighting to compensate for any processing delays
    // This makes the highlighting appear more in sync with the audio
    const adjustedTime = Math.max(0, currentTime - 0.3);
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      if (adjustedTime >= segment.startTime && adjustedTime < (segment.endTime || Number.POSITIVE_INFINITY)) {
        if (i !== activeSegmentIndex) {
          setActiveSegmentIndex(i)
        }
        break
      }
    }
  }

  // Start playback
  const startPlayback = () => {
    if (!audioRef.current || !isAudioReady) {
      setError("Audio is not ready yet. Please wait a moment.")
      return
    }

    try {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true)
          startProgressInterval()
          setError(null)
        })
        .catch((err) => {
          console.error("Error playing audio:", err)
          setError(`Failed to play audio: ${err.message || "Unknown error"}`)
          setIsPlaying(false)
        })
    } catch (err: any) {
      console.error("Error playing audio:", err)
      setError(`Failed to play audio: ${err.message || "Unknown error"}`)
      setIsPlaying(false)
    }
  }

  // Stop playback
  const stopPlayback = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    setIsPlaying(false)
    clearProgressInterval()
  }

  // Toggle playback
  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback()
    } else {
      startPlayback()
    }
  }

  // Handle segment click
  const handleSegmentClick = (index: number) => {
    if (!audioRef.current || !isAudioReady) {
      setError("Audio is not ready yet. Please wait a moment.")
      return
    }

    setActiveSegmentIndex(index)

    if (onSegmentClick) {
      onSegmentClick(index)
    }

    // Jump to the start time of the clicked segment
    const startTime = segments[index].startTime
    audioRef.current.currentTime = startTime

    // If not already playing, start playback
    if (!isPlaying) {
      startPlayback()
    }
  }

  // Handle seek on progress bar
  const handleSeek = (position: number) => {
    if (!audioRef.current || !duration || !isAudioReady) return

    // Calculate the time based on position percentage
    const seekTime = (position / 100) * duration
    audioRef.current.currentTime = seekTime

    // Update active segment
    updateActiveSegment(seekTime)

    // If not already playing, start playback
    if (!isPlaying) {
      startPlayback()
    }
  }

  // Group segments into paragraphs based on their content
  const groupSegmentsIntoParagraphs = () => {
    // For the AI content, we'll create paragraphs based on the content
    // This is a simple approach - in a real app, you might want to use more sophisticated logic
    const paragraphs: TimestampedSegment[][] = []
    let currentParagraph: TimestampedSegment[] = []

    segments.forEach((segment, index) => {
      // Add segment to current paragraph
      currentParagraph.push(segment)

      // Check if we should start a new paragraph
      // For this example, we'll create a new paragraph every 3-4 segments or if the segment ends with a question mark
      const isEndOfParagraph =
        currentParagraph.length >= 3 || // Create a new paragraph after 3 segments
        segment.text.endsWith(".") || // End paragraph on full stop
        segment.text.endsWith("?") || // End paragraph on question mark
        segment.text.endsWith("!") || // End paragraph on exclamation point
        segment.text.endsWith('"') || // End paragraph on quote
        segment.text.endsWith('"') || // End paragraph on smart quote
        index === segments.length - 1 // End paragraph on last segment

      if (isEndOfParagraph) {
        paragraphs.push([...currentParagraph])
        currentParagraph = []
      }
    })

    return paragraphs
  }

  const paragraphs = groupSegmentsIntoParagraphs()

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
              {paragraphs.map((paragraph, paragraphIndex) => (
                <p
                  key={paragraphIndex}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
                >
                  {paragraph.map((segment) => {
                    // Find the global index of this segment
                    const globalIndex = segments.findIndex((s) => s === segment)
                    
                    return (
                      <span
                        key={globalIndex}
                        ref={globalIndex === activeSegmentIndex ? activeSegmentRef : null}
                        onClick={(e) => {
                          if (e) {
                            e.stopPropagation()
                          }
                          handleSegmentClick(globalIndex)
                        }}
                        className={`inline cursor-pointer transition-colors duration-300 rounded-sm ${
                          globalIndex === activeSegmentIndex
                            ? "text-white"
                            : globalIndex < activeSegmentIndex
                              ? "text-white/60"
                              : "text-white/30"
                        }`}
                      >
                        {segment.text}{" "}
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
