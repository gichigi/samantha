// TTS Service using Web Speech API
export class TTSService {
  private synthesis: SpeechSynthesis
  private utterance: SpeechSynthesisUtterance | null = null
  private voices: SpeechSynthesisVoice[] = []
  private currentWordIndex = 0
  private text = ""
  private words: string[] = []
  private onWordChange: ((index: number) => void) | null = null
  private onFinish: (() => void) | null = null
  private onError: ((error: string) => void) | null = null
  private onVoiceSelected: ((voice: SpeechSynthesisVoice | null) => void) | null = null
  private preferredVoice: string | null = null
  private isSupported: boolean = false
  private voicesLoaded: boolean = false

  constructor() {
    // Check if browser supports speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synthesis = window.speechSynthesis
      this.isSupported = true

      // Initialize voices
      this.initializeVoices()
    } else {
      console.error("Speech synthesis not supported in this browser")
      this.isSupported = false
      // Fallback to a mock synthesis for development
      this.synthesis = {
        speak: () => {},
        cancel: () => {},
        pause: () => {},
        resume: () => {},
        speaking: false,
        paused: false,
        pending: false,
      } as unknown as SpeechSynthesis
    }
  }

  // Initialize and load voices with proper error handling
  private initializeVoices(): void {
    try {
      // Get available voices
      this.voices = this.synthesis.getVoices()
      
      // If voices are already available
      if (this.voices.length > 0) {
        this.voicesLoaded = true
        console.log(`Loaded ${this.voices.length} voices:`, 
          this.voices.slice(0, 3).map(v => v.name).join(', ') + 
          (this.voices.length > 3 ? '...' : ''))
      } 
      // If voices array is empty, wait for voiceschanged event
      else {
        console.log("No voices available yet, waiting for voiceschanged event")
        this.synthesis.addEventListener("voiceschanged", () => {
          this.voices = this.synthesis.getVoices()
          this.voicesLoaded = true
          console.log(`Loaded ${this.voices.length} voices after voiceschanged event`)
        })
        
        // Set a timeout to check if voices were loaded
        setTimeout(() => {
          if (!this.voicesLoaded && this.voices.length === 0) {
            console.warn("Voices did not load within timeout period")
            if (this.onError) {
              this.onError("Voice loading timed out. Speech functionality may be limited.")
            }
          }
        }, 3000)
      }
    } catch (error) {
      console.error("Error initializing voices:", error)
      if (this.onError) {
        this.onError("Failed to initialize speech voices. Please try reloading the page.")
      }
    }
  }

  // Set callbacks
  public setCallbacks(
    onWordChange: (index: number) => void, 
    onFinish: () => void,
    onError?: (error: string) => void,
    onVoiceSelected?: (voice: SpeechSynthesisVoice | null) => void
  ) {
    this.onWordChange = onWordChange
    this.onFinish = onFinish
    if (onError) this.onError = onError
    if (onVoiceSelected) this.onVoiceSelected = onVoiceSelected
  }

  // Check if TTS is supported
  public isFeatureSupported(): boolean {
    return this.isSupported
  }

  // Get available voices
  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }

  // Get female voices
  public getFemaleVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(
      (voice) =>
        voice.name.includes("female") ||
        voice.name.includes("Female") ||
        voice.name.includes("girl") ||
        voice.name.includes("Girl") ||
        voice.name.includes("woman") ||
        voice.name.includes("Woman"),
    )
  }

  // Get English voices
  public getEnglishVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(
      (voice) => 
        voice.lang.startsWith("en-") ||
        voice.lang === "en"
    )
  }

  // Set preferred voice by name
  public setPreferredVoice(voiceName: string): void {
    this.preferredVoice = voiceName
  }

  // Find best voice match based on preferences and availability
  private findBestVoice(): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      return null
    }

    // Check for user's preferred voice if set
    if (this.preferredVoice) {
      const preferred = this.voices.find(v => v.name === this.preferredVoice)
      if (preferred) {
        console.log(`Using preferred voice: ${preferred.name}`)
        return preferred
      }
    }

    // Try to find a female English voice (best quality typically)
    const femaleEnglishVoices = this.getFemaleVoices().filter(
      voice => voice.lang.startsWith("en-") || voice.lang === "en"
    )
    
    if (femaleEnglishVoices.length > 0) {
      console.log(`Using female English voice: ${femaleEnglishVoices[0].name}`)
      return femaleEnglishVoices[0]
    }
    
    // Try any female voice
    const femaleVoices = this.getFemaleVoices()
    if (femaleVoices.length > 0) {
      console.log(`Using female voice: ${femaleVoices[0].name}`)
      return femaleVoices[0]
    }
    
    // Try any English voice
    const englishVoices = this.getEnglishVoices()
    if (englishVoices.length > 0) {
      console.log(`Using English voice: ${englishVoices[0].name}`)
      return englishVoices[0]
    }
    
    // Last resort: use the first available voice
    console.log(`Falling back to first available voice: ${this.voices[0].name}`)
    return this.voices[0]
  }

  // Prepare text for speaking
  public prepare(text: string): void {
    this.text = text
    this.words = text.split(" ")
    this.currentWordIndex = 0
  }

  // Check if browser might block autoplay
  public async checkAutoplayPermission(): Promise<boolean> {
    if (!this.isSupported) return false
    
    try {
      // Create a short audio element to test autoplay
      const audio = new Audio()
      audio.src = "data:audio/mpeg;base64,/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
      audio.volume = 0.01 // Very low volume
      
      // Try to play the audio
      await audio.play()
      // If we get here, autoplay is allowed
      audio.pause()
      return true
    } catch (e) {
      console.warn("Autoplay may be blocked by browser policy:", e)
      return false
    }
  }

  // Start speaking
  public speak(startWordIndex = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.text) {
        if (this.onError) this.onError("No text to speak")
        reject("No text to speak")
        return
      }

      if (!this.isSupported) {
        if (this.onError) this.onError("Speech synthesis not supported in this browser")
        reject("Speech synthesis not supported")
        return
      }

      try {
    // Cancel any ongoing speech
    this.synthesis.cancel()

    // Create a new utterance
    this.utterance = new SpeechSynthesisUtterance(this.text)

        // Find the best available voice
        const bestVoice = this.findBestVoice()
        if (bestVoice) {
          this.utterance.voice = bestVoice
          // Notify about selected voice
          if (this.onVoiceSelected) {
            this.onVoiceSelected(bestVoice)
          }
        } else {
          console.warn("No voices available for speech synthesis")
          if (this.onError) this.onError("No voices available. Speech quality may be affected.")
          if (this.onVoiceSelected) {
            this.onVoiceSelected(null)
          }
    }

    // Set properties
    this.utterance.rate = 1.0 // Speed (0.1 to 10)
    this.utterance.pitch = 1.0 // Pitch (0 to 2)
    this.utterance.volume = 1.0 // Volume (0 to 1)

    // Set up word boundary detection
    this.utterance.onboundary = (event) => {
      if (event.name === "word") {
        // Calculate which word we're on
        const upToChar = this.text.substring(0, event.charIndex)
        const wordCount = upToChar.split(" ").length - 1

        this.currentWordIndex = wordCount

        // Call the callback if provided
        if (this.onWordChange) {
          this.onWordChange(this.currentWordIndex)
        }
      }
    }

    // Set up end event
    this.utterance.onend = () => {
      if (this.onFinish) {
        this.onFinish()
      }
          resolve()
        }

        // Set up error event
        this.utterance.onerror = (event) => {
          console.error("Speech synthesis error:", event)
          if (this.onError) {
            this.onError(`Speech synthesis error: ${event.error || "Unknown error"}`)
          }
          reject(event)
    }

    // Start from a specific word if requested
    if (startWordIndex > 0 && startWordIndex < this.words.length) {
      const textToSpeak = this.words.slice(startWordIndex).join(" ")
      this.utterance.text = textToSpeak
      this.currentWordIndex = startWordIndex

      // Update callback with starting position
      if (this.onWordChange) {
        this.onWordChange(this.currentWordIndex)
      }
    }

    // Start speaking
    this.synthesis.speak(this.utterance)
      } catch (error) {
        console.error("Error starting speech:", error)
        if (this.onError) {
          this.onError(`Failed to start speech: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
        reject(error)
      }
    })
  }

  // Pause speaking
  public pause(): void {
    if (this.isSupported) {
    this.synthesis.pause()
    }
  }

  // Resume speaking
  public resume(): void {
    if (this.isSupported) {
    this.synthesis.resume()
    }
  }

  // Stop speaking
  public stop(): void {
    if (this.isSupported) {
    this.synthesis.cancel()
    }
  }

  // Check if speaking
  public isSpeaking(): boolean {
    return this.isSupported && this.synthesis.speaking
  }

  // Check if paused
  public isPaused(): boolean {
    return this.isSupported && this.synthesis.paused
  }

  // Set speaking rate (0.1 to 10)
  public setRate(rate: number): void {
    if (this.utterance) {
      this.utterance.rate = rate
    }
  }

  // Get current TTS state
  public getState(): {
    isSupported: boolean,
    voicesLoaded: boolean,
    voiceCount: number,
    isSpeaking: boolean,
    isPaused: boolean
  } {
    return {
      isSupported: this.isSupported,
      voicesLoaded: this.voicesLoaded,
      voiceCount: this.voices.length,
      isSpeaking: this.isSupported && this.synthesis.speaking,
      isPaused: this.isSupported && this.synthesis.paused
    }
  }
}

// Create a singleton instance
let ttsServiceInstance: TTSService | null = null

export function getTTSService(): TTSService {
  if (!ttsServiceInstance) {
    ttsServiceInstance = new TTSService()
  }
  return ttsServiceInstance
}
