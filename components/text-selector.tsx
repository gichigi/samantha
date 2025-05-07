"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { sampleTexts } from "@/data/sample-texts"

interface TextSelectorProps {
  onSelectText: (text: string, index: number) => void
  currentTextIndex: number
}

export default function TextSelector({ onSelectText, currentTextIndex }: TextSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(currentTextIndex)

  // Update the selected index when the prop changes
  useEffect(() => {
    setSelectedIndex(currentTextIndex)
  }, [currentTextIndex])

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const handleSelectText = (index: number) => {
    setSelectedIndex(index)
    onSelectText(sampleTexts[index].content, index)
    setIsOpen(false)
  }

  return (
    <div className="relative z-20">
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-between w-full px-4 py-2 bg-white/20 backdrop-blur-sm rounded-md text-white"
      >
        <span>{sampleTexts[selectedIndex].title}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white/90 backdrop-blur-md rounded-md shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {sampleTexts.map((text, index) => (
              <button
                key={index}
                onClick={() => handleSelectText(index)}
                className={`w-full px-4 py-3 text-left hover:bg-blue-100 transition-colors ${
                  index === selectedIndex ? "bg-blue-50 font-medium" : "text-gray-800"
                }`}
              >
                <div className="font-medium">{text.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {text.wordCount} words · {text.readingTime} min read
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
