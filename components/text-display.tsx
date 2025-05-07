"use client"

import { useRef, useEffect } from "react"

interface TextDisplayProps {
  text: string
  activeWordIndex: number
  onWordClick: (index: number) => void
}

export default function TextDisplay({ text, activeWordIndex, onWordClick }: TextDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeWordRef = useRef<HTMLSpanElement>(null)

  // Split text into paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)

  // Create a flat array of all words for tracking the active word
  const allWords = text.split(/\s+/)

  // Keep track of the global word index
  let globalWordIndex = 0

  // Auto-scroll to keep active word in the middle of the viewport
  useEffect(() => {
    if (activeWordRef.current && containerRef.current) {
      const container = containerRef.current
      const activeWord = activeWordRef.current

      // Calculate the position to scroll to (word position - half of container height + half of word height)
      const wordTop = activeWord.offsetTop
      const wordHeight = activeWord.offsetHeight
      const containerHeight = container.clientHeight
      const scrollPosition = wordTop - containerHeight / 2 + wordHeight / 2

      // Smooth scroll to the position
      container.scrollTo({
        top: scrollPosition,
        behavior: "smooth",
      })
    }
  }, [activeWordIndex])

  return (
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
            {paragraphs.map((paragraph, paragraphIndex) => {
              // Split paragraph into words
              const words = paragraph.split(/\s+/)

              return (
                <p
                  key={paragraphIndex}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
                >
                  {words.map((word, wordIndex) => {
                    // Store the current global word index
                    const currentGlobalIndex = globalWordIndex

                    // Increment the global word index for the next word
                    globalWordIndex++

                    return (
                      <span
                        key={`${paragraphIndex}-${wordIndex}`}
                        ref={currentGlobalIndex === activeWordIndex ? activeWordRef : null}
                        onClick={(e) => {
                          e.stopPropagation()
                          onWordClick(currentGlobalIndex)

                          // Visual feedback when tapping a word
                          const target = e.target as HTMLElement
                          target.classList.add("tap-animation")
                          setTimeout(() => {
                            target.classList.remove("tap-animation")
                          }, 300)
                        }}
                        className={`inline-block mr-2 mb-2 cursor-pointer transition-colors duration-300 rounded-sm ${
                          currentGlobalIndex === activeWordIndex
                            ? "text-white"
                            : currentGlobalIndex < activeWordIndex
                              ? "text-white/60"
                              : "text-white/30"
                        }`}
                      >
                        {word}
                      </span>
                    )
                  })}
                </p>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
