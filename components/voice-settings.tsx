"use client"

import type React from "react"

import { useState } from "react"
import { Settings, X } from "lucide-react"
import { getOpenAITTSService } from "@/services/openai-tts-service"

interface VoiceSettingsProps {
  onSettingsChanged: () => void
}

export default function VoiceSettings({ onSettingsChanged }: VoiceSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ttsService = getOpenAITTSService()
  const initialSettings = ttsService.getSettings()

  const [settings, setSettings] = useState({
    voice: initialSettings.voice,
    speed: initialSettings.speed,
    model: initialSettings.model,
  })

  const toggleSettings = () => {
    setIsOpen(!isOpen)
  }

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVoice = e.target.value
    setSettings({ ...settings, voice: newVoice })
    ttsService.setVoice(newVoice)
    onSettingsChanged()
  }

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = Number.parseFloat(e.target.value)
    setSettings({ ...settings, speed: newSpeed })
    ttsService.setSpeed(newSpeed)
    onSettingsChanged()
  }

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value
    setSettings({ ...settings, model: newModel })
    ttsService.setModel(newModel)
    onSettingsChanged()
  }

  return (
    <div className="relative z-10">
      <button
        onClick={toggleSettings}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
        aria-label="Voice settings"
      >
        <Settings size={24} />
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white/90 backdrop-blur-md rounded-lg shadow-lg p-4 w-72 text-black">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Voice Settings</h3>
            <button onClick={toggleSettings} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Voice</label>
              <select
                value={settings.voice}
                onChange={handleVoiceChange}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="nova">Nova (Female)</option>
                <option value="alloy">Alloy (Neutral)</option>
                <option value="echo">Echo (Male)</option>
                <option value="fable">Fable (Young)</option>
                <option value="onyx">Onyx (Deep Male)</option>
                <option value="shimmer">Shimmer (Bright Female)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Speed: {settings.speed.toFixed(2)}x</label>
              <input
                type="range"
                min="0.25"
                max="2.0"
                step="0.05"
                value={settings.speed}
                onChange={handleSpeedChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quality</label>
              <select
                value={settings.model}
                onChange={handleModelChange}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="tts-1">Standard</option>
                <option value="tts-1-hd">High Definition</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
