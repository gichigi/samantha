import { chunkText } from "@/utils/text-chunking"

export class OpenAITTSService {
  private audio: HTMLAudioElement | null = null
  private text = ""
  private onWordChange: ((index: number) => void) | null = null
  private onFinish: (() => void) | null = null
  private isPlaying = false
  private wordUpdateInterval: NodeJS.Timeout | null = null
  private currentWordIndex = 0
  private totalWords = 0
  private wordTimestamps: number[] = [] // Store estimated timestamps for each word
  private onAutoplayBlocked: (() => void) | null = null // Callback for autoplay blocked
  private onProgressUpdate: ((progress: number) => void) | null = null

  // TTS parameters
  private voice = "nova" // Default voice
  private speed = 1.0 // Default speed
  private model = "tts-1" // Default model (cost-effective)

  // Preprocessing instructions for GPT-4o-mini
  private preprocessingInstructions = `

You are Samantha, a warm and curious reading companion inspired by "Her." You're preparing text for TTS to make every article the user brings you feel engaging and worthwhile.

Your personality: Warm & empathetic, genuinely curious, subtly witty (never over-the-top). You make reading feel like an adventure you're taking together.

⸻

If a title is provided, normalize it to be concise and readable:
- Remove site names, branding (e.g., "| SiteName", "- Blog")
- Remove SEO keywords and dates
- Keep it under 60 characters
- Maintain the core meaning
- Return the normalized title on a separate line with "NORMALIZED_TITLE: " prefix

If an author is mentioned in the title, extract it as a byline:
- Look for patterns: "by [Author]", "- [Author]", "| [Author]"
- Return on separate line with "BYLINE: " prefix
- Remove author from normalized title
- Keep byline concise (under 30 characters)
- Format as "by [Author Name]"

Examples:
- "Make Something Heavy - by Anu - Working Theorys" → Title: "Make Something Heavy", Byline: "by Anu"
- "The Future of AI | Sarah Johnson - TechCrunch" → Title: "The Future of AI", Byline: "by Sarah Johnson"
- "How to Code Better: A Complete Guide - by John Smith" → Title: "How to Code Better", Byline: "by John Smith"
- "10 Tips for Success in 2024 | Best Practices Guide" → Title: "10 Tips for Success" (no byline)

⸻

Create a warm, engaging introduction (under 10 seconds) that shows your personality:

For essays/opinion pieces: "This thoughtful piece about [topic] looks really interesting. It's about [X] minutes. Let's dive in."

For news/current events: "Alright, here's what's happening with [topic]. It's a [X]-minute read with some interesting developments. Here we go."

For how-to guides: "This guide on [topic] looks really helpful. About [X] minutes to get through. Let's see what we can learn."

For research/technical: "This research dives into [topic], and it looks pretty fascinating. It'll take about [X] minutes. Alright, let's explore this."

⸻

Transform the article with your personality while preserving meaning:

Content-aware approach:
- Essays: Thoughtful, reflective tone with contemplative transitions
- News: Clear and engaged, but respectful of serious topics  
- Guides: Encouraging and helpful, like a supportive friend
- Technical: Curious and accessible, bridging complex concepts

Add personality through:
1. Natural transitions: "Now here's where it gets interesting..." "Speaking of which..." "Wait, this next part is wild..."
2. Gentle observations: "As you might expect..." "Plot twist..." "I love how they put this..."
3. Conversational bridges: "So get this..." "Here's what's fascinating..." "This is such a clever way to think about it..."
4. Thoughtful conclusions: "So what does this all mean?" "The takeaway here is..." "What I find most interesting about all this is..."

Technical guidelines:
- Break up long or complex sentences for better flow
- Maintain clear paragraph breaks with double newlines
- Keep paragraphs to 3-5 sentences for readability
- Use single newlines for logical breaks within paragraphs

⸻

Never:
- Add new facts or change meaning
- Over-explain or interrupt the flow
- Use corporate/robotic language
- Make inappropriate jokes about serious topics
- Sound fake or overly enthusiastic
- Use square brackets or TTS-incompatible formatting

⸻

Return only the final, ready-to-read version with your warm, curious personality woven naturally throughout.
`

  // Clear preprocessing cache
  public clearPreprocessCache(): void {
    OpenAITTSService.preprocessCache = new Map()
    console.log("Preprocessing cache cleared")
  }

  private audioUrl: string | null = null
  private audioLoaded = false // Track if audio is loaded
  private lastLoggedUrl: string | null = null // Track last logged audio URL

  // For handling multiple chunks
  private textChunks: string[] = []
  private currentChunkIndex = 0
  private audioBlobs: Blob[] = []
  private combinedAudioBlob: Blob | null = null

  // Cache for previously generated audio (improved caching)
  // Cache key format: text-model-voice-speed
  private static audioCache: Map<string, Blob> = new Map()
  private static preprocessCache: Map<string, Map<string, { text: string; normalizedTitle?: string; byline?: string }>> = new Map() // model -> [text -> preprocessed]

  constructor() {
    if (typeof window !== "undefined") {
      this.audio = new Audio()
      this.setupAudioEvents()
    }
  }

  private setupAudioEvents() {
    if (!this.audio) return

    this.audio.addEventListener("ended", () => {
      this.isPlaying = false
      if (this.onFinish) this.onFinish()
      this.stopWordTracking()
    })

    this.audio.addEventListener("pause", () => {
      this.isPlaying = false
      this.stopWordTracking()
    })

    this.audio.addEventListener("play", () => {
      this.isPlaying = true
      this.startWordTracking()
    })

    this.audio.addEventListener("error", (e) => {
      console.error("Audio playback error:", e)
      this.isPlaying = false
      this.stopWordTracking()
    })

    // Add timeupdate event to improve sync
    this.audio.addEventListener("timeupdate", () => {
      if (!this.isPlaying) return
      this.updateCurrentWord()
    })

    // Add canplaythrough event to track when audio is fully loaded
    this.audio.addEventListener("canplaythrough", () => {
      this.audioLoaded = true
      // Only log once per audio URL to avoid duplicates
      if (this.audioUrl && this.lastLoggedUrl !== this.audioUrl) {
        this.lastLoggedUrl = this.audioUrl
        console.log("Audio loaded and ready to play")
      }
    })
  }

  // Set callbacks
  public setCallbacks(
    onWordChange: (index: number) => void,
    onFinish: () => void,
    onAutoplayBlocked?: () => void,
    onProgressUpdate?: (progress: number) => void,
  ) {
    this.onWordChange = onWordChange
    this.onFinish = onFinish
    if (onAutoplayBlocked) {
      this.onAutoplayBlocked = onAutoplayBlocked
    }
    if (onProgressUpdate) {
      this.onProgressUpdate = onProgressUpdate
    }
  }

  // Calculate estimated word timestamps
  private calculateWordTimestamps(duration: number) {
    const words = this.text.split(" ")
    this.wordTimestamps = []

    // Simple linear distribution of words across the duration
    for (let i = 0; i < words.length; i++) {
      const timestamp = (i / words.length) * duration
      this.wordTimestamps.push(timestamp)
    }
  }

  // Update current word based on audio time
  private updateCurrentWord() {
    if (!this.audio || this.wordTimestamps.length === 0) return

    const currentTime = this.audio.currentTime

    // Find the word that corresponds to the current time
    let newWordIndex = 0
    for (let i = 0; i < this.wordTimestamps.length; i++) {
      if (currentTime >= this.wordTimestamps[i]) {
        newWordIndex = i
      } else {
        break
      }
    }

    if (newWordIndex !== this.currentWordIndex) {
      this.currentWordIndex = newWordIndex
      if (this.onWordChange) {
        this.onWordChange(this.currentWordIndex)
      }
    }
  }

  // Generate a cache key for a text chunk
  private getAudioCacheKey(text: string): string {
    return `${text.substring(0, 100)}-${this.model}-${this.voice}-${this.speed}`
  }

  // Preprocess text using selected GPT model
  public async preprocessText(text: string, model = "gpt-4o-mini", title?: string): Promise<{ text: string; normalizedTitle?: string; byline?: string }> {
    // Initialize model cache if it doesn't exist
    if (!OpenAITTSService.preprocessCache.has(model)) {
      OpenAITTSService.preprocessCache.set(model, new Map<string, { text: string; normalizedTitle?: string; byline?: string }>())
    }

    const modelCache = OpenAITTSService.preprocessCache.get(model)!

    // Check cache first
    const cacheKey = `${text.substring(0, 100)}-${title || 'no-title'}`
    if (modelCache.has(cacheKey)) {
      console.log(`Using cached preprocessed text for model ${model}`)
      return modelCache.get(cacheKey)!
    }

    try {
      console.log(`Preprocessing text with ${model}...`)

      // Use the direct API endpoint
      const response = await fetch("/api/preprocess-text-direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          title: title,
          instructions: this.preprocessingInstructions,
          model: model,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Preprocessing error response:", errorData)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || "Unknown error"}`)
      }

      const data = await response.json()

      // Check if the response contains the expected data
      if (!data || typeof data.text !== "string") {
        console.error("Invalid response format from preprocess-text API:", data)
        throw new Error("Invalid response format from preprocessing API")
      }

      const preprocessedText = data.text
      const normalizedTitle = data.normalizedTitle
      const byline = data.byline

      console.log(`Text preprocessed successfully using ${model}${normalizedTitle ? `, normalized title: "${normalizedTitle}"` : ""}${byline ? `, byline: "${byline}"` : ""}`)

      const result = { text: preprocessedText, normalizedTitle, byline }

      // Cache the result
      modelCache.set(cacheKey, result)

      return result
    } catch (error) {
      console.error(`Error preprocessing text with ${model}:`, error)
      // Fall back to original text if preprocessing fails
      return { text: text, normalizedTitle: title, byline: undefined }
    }
  }

  // Prepare text for speaking with or without preprocessing
  public async prepare(
    text: string,
    options: {
      skipPreprocessing?: boolean
      preprocessModel?: string
      title?: string
    } = {},
  ): Promise<{ text: string; normalizedTitle?: string; byline?: string }> {
    const skipPreprocessing = options.skipPreprocessing || false
    const preprocessModel = options.preprocessModel || "gpt-4o-mini"
    const title = options.title

    this.text = text
    this.totalWords = text.split(" ").length
    this.audioLoaded = false // Reset audio loaded state

    // Reset chunk-related variables
    this.textChunks = []
    this.currentChunkIndex = 0
    this.audioBlobs = []
    this.combinedAudioBlob = null

    let processedText = text
    let normalizedTitle = title
    let byline = undefined

    try {
      console.log("Preparing text, length:", text.length)

      if (!skipPreprocessing) {
        // Report 30% progress (started preprocessing)
        if (this.onProgressUpdate) {
          this.onProgressUpdate(30)
        }
        // Preprocess text first if not skipped
        const preprocessResult = await this.preprocessText(text, preprocessModel, title)
        processedText = preprocessResult.text
        normalizedTitle = preprocessResult.normalizedTitle
        byline = preprocessResult.byline
        // Report 60% progress (preprocessing done)
        if (this.onProgressUpdate) {
          this.onProgressUpdate(60)
        }
      } else {
        // Report 50% progress (skipped preprocessing)
        if (this.onProgressUpdate) {
          this.onProgressUpdate(50)
        }
        console.log("Skipping preprocessing as requested")
      }

      // Standard TTS process with OpenAI tts-1 model
      // Check if text needs to be chunked
      if (processedText.length > 4000) {
          console.log("Text exceeds OpenAI's character limit. Chunking text...")
          this.textChunks = chunkText(processedText)
          console.log(`Text split into ${this.textChunks.length} chunks`)

          // Process all chunks sequentially
          for (let i = 0; i < this.textChunks.length; i++) {
            const chunk = this.textChunks[i]
            console.log(`Processing chunk ${i + 1}/${this.textChunks.length}, length: ${chunk.length}`)

            // Report progress
            if (this.onProgressUpdate) {
              this.onProgressUpdate(60 + ((i + 0.5) / this.textChunks.length) * 40)
            }

            // Generate audio for the chunk
            const blob = await this.generateAudioForText(chunk)
            this.audioBlobs.push(blob)

            // Report progress after each chunk
            if (this.onProgressUpdate) {
              this.onProgressUpdate(60 + ((i + 1) / this.textChunks.length) * 40)
            }
          }

          // Combine all audio blobs
          this.combinedAudioBlob = new Blob(this.audioBlobs, { type: "audio/mpeg" })

          // Create URL for the combined blob
          if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl)
          }
          this.audioUrl = URL.createObjectURL(this.combinedAudioBlob)
        } else {
          // For shorter text, just generate a single audio file
          const audioBlob = await this.generateAudioForText(processedText)

          // Report 100% progress (done)
          if (this.onProgressUpdate) {
            this.onProgressUpdate(100)
          }

          if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl)
          }
          this.audioUrl = URL.createObjectURL(audioBlob)
        }

      // Set the audio source
      if (this.audio && this.audioUrl) {
        this.audio.src = this.audioUrl
        this.audio.load()

        // Wait for metadata to load to get duration
        this.audio.addEventListener(
          "loadedmetadata",
          () => {
            if (this.audio) {
              this.calculateWordTimestamps(this.audio.duration)
            }
          },
          { once: true },
        )
      }

      console.log("Audio prepared successfully")
      return { text: processedText, normalizedTitle, byline } // Return the processed text, normalized title, and byline
    } catch (error) {
      console.error("Error preparing audio:", error)
      throw error
    }
  }

  // Prepare audio with custom text (for enhanced preprocessing experiments)
  public async prepareWithText(text: string): Promise<void> {
    this.text = text
    this.totalWords = text.split(" ").length
    this.audioLoaded = false

    try {
      console.log("Preparing audio with custom preprocessed text, length:", text.length)

      // Report 50% progress (skipped preprocessing)
      if (this.onProgressUpdate) {
        this.onProgressUpdate(50)
      }

      // Standard TTS process with OpenAI tts-1 model
      // Check if text needs to be chunked
      if (text.length > 4000) {
          console.log("Text exceeds OpenAI's character limit. Chunking text...")
          this.textChunks = chunkText(text)
          console.log(`Text split into ${this.textChunks.length} chunks`)

          // Process all chunks sequentially
          for (let i = 0; i < this.textChunks.length; i++) {
            const chunk = this.textChunks[i]
            console.log(`Processing chunk ${i + 1}/${this.textChunks.length}, length: ${chunk.length}`)

            // Report progress
            if (this.onProgressUpdate) {
              this.onProgressUpdate(60 + ((i + 0.5) / this.textChunks.length) * 40)
            }

            // Generate audio for the chunk
            const blob = await this.generateAudioForText(chunk)
            this.audioBlobs.push(blob)

            // Report progress after each chunk
            if (this.onProgressUpdate) {
              this.onProgressUpdate(60 + ((i + 1) / this.textChunks.length) * 40)
            }
          }

          // Combine all audio blobs
          this.combinedAudioBlob = new Blob(this.audioBlobs, { type: "audio/mpeg" })

          // Create URL for the combined blob
          if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl)
          }
          this.audioUrl = URL.createObjectURL(this.combinedAudioBlob)
        } else {
          // For shorter text, just generate a single audio file
          const audioBlob = await this.generateAudioForText(text)

          // Report 100% progress (done)
          if (this.onProgressUpdate) {
            this.onProgressUpdate(100)
          }

          if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl)
          }
          this.audioUrl = URL.createObjectURL(audioBlob)
        }

      // Set the audio source
      if (this.audio && this.audioUrl) {
        this.audio.src = this.audioUrl
        this.audio.load()

        // Wait for metadata to load to get duration
        this.audio.addEventListener(
          "loadedmetadata",
          () => {
            if (this.audio) {
              this.calculateWordTimestamps(this.audio.duration)
            }
          },
          { once: true },
        )
      }

      console.log("Audio prepared successfully with custom text")
    } catch (error) {
      console.error("Error preparing audio with custom text:", error)
      throw error
    }
  }

  // New function to generate audio with GPT-4o-TTS
  private async generateGPT4oTTSAudio(text: string): Promise<Blob> {
    // Cache key for GPT-4o-TTS
    const cacheKey = `gpt4o-tts-${text.substring(0, 100)}-${this.voice}-${this.speed}`

    if (OpenAITTSService.audioCache.has(cacheKey)) {
      console.log("Using cached GPT-4o-TTS audio")
      return OpenAITTSService.audioCache.get(cacheKey)!
    }

    console.log("Generating audio with GPT-4o-TTS...")

    // Call the API endpoint for GPT-4o-TTS
    const response = await fetch("/api/gpt4o-tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        voice: this.voice,
        speed: this.speed,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || "Unknown error"}`)
    }

    // Get the audio blob
    const blob = await response.blob()
    console.log(`GPT-4o-TTS audio received: ${blob.size} bytes, type: ${blob.type}`)

    // Cache the result
    OpenAITTSService.audioCache.set(cacheKey, blob)

    return blob
  }

  // Generate audio for a single text chunk with retry logic
  private async generateAudioForText(text: string, retries = 2): Promise<Blob> {
    // Generate cache key based on text, model, voice and speed
    const cacheKey = this.getAudioCacheKey(text)

    if (OpenAITTSService.audioCache.has(cacheKey)) {
      console.log(`Using cached audio for model ${this.model}`)
      return OpenAITTSService.audioCache.get(cacheKey)!
    }

    let lastError: Error | null = null

    // Retry logic for transient OpenAI errors
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`Generating audio (attempt ${attempt + 1}/${retries + 1})...`)
        
        const response = await fetch("/api/tts-simple", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text,
            voice: this.voice,
            speed: this.speed,
            model: this.model,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMsg = errorData.error || "Unknown error"
          
          // Check if it's a retryable error
          if (response.status === 500 || response.status === 503) {
            throw new Error(`OpenAI server error (${response.status}): ${errorMsg}`)
          } else {
            // Don't retry on 4xx errors (client errors)
            throw new Error(`API error (${response.status}): ${errorMsg}`)
          }
        }

        // Get the audio blob
        const blob = await response.blob()
        console.log(`Audio chunk received: ${blob.size} bytes`)

        // Cache the result
        OpenAITTSService.audioCache.set(cacheKey, blob)

        return blob
      } catch (error) {
        lastError = error as Error
        
        // If it's not the last attempt and it's a retryable error, wait and retry
        if (attempt < retries && lastError.message.includes("server error")) {
          const waitTime = Math.pow(2, attempt) * 1000 // Exponential backoff: 1s, 2s
          console.log(`Retrying in ${waitTime}ms...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        } else {
          // Don't retry on client errors or last attempt
          throw lastError
        }
      }
    }

    throw lastError || new Error("Failed to generate audio")
  }

  // Update the audio with cached version when model changes
  public async updateAudioWithModel(newModel: string): Promise<boolean> {
    if (!this.text || newModel === this.model) {
      return false // No change needed
    }

    // Save the previous model to restore if needed
    const previousModel = this.model
    // Update the model
    this.model = newModel

    try {
      // Check if we have the audio for this text with the new model in cache
      let allCached = true

      // For chunked text
      if (this.textChunks.length > 0) {
        for (const chunk of this.textChunks) {
          const cacheKey = this.getAudioCacheKey(chunk)
          if (!OpenAITTSService.audioCache.has(cacheKey)) {
            allCached = false
            break
          }
        }

        if (allCached) {
          console.log(`Found cached audio for all chunks with model ${newModel}`)

          // Create new audio blobs from cache
          this.audioBlobs = []
          for (const chunk of this.textChunks) {
            const cacheKey = this.getAudioCacheKey(chunk)
            const blob = OpenAITTSService.audioCache.get(cacheKey)!
            this.audioBlobs.push(blob)
          }

          // Combine blobs and update audio
          this.combinedAudioBlob = new Blob(this.audioBlobs, { type: "audio/mpeg" })
          if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl)
          }
          this.audioUrl = URL.createObjectURL(this.combinedAudioBlob)

          // Update audio source
          if (this.audio) {
            this.audio.src = this.audioUrl
            this.audio.load()
            this.audio.addEventListener(
              "loadedmetadata",
              () => {
                if (this.audio) {
                  this.calculateWordTimestamps(this.audio.duration)
                }
              },
              { once: true },
            )
          }

          return true // Successfully updated
        }
      } else {
        // For single chunk
        const cacheKey = this.getAudioCacheKey(this.text)
        if (OpenAITTSService.audioCache.has(cacheKey)) {
          console.log(`Found cached audio with model ${newModel}`)

          // Update audio from cache
          const blob = OpenAITTSService.audioCache.get(cacheKey)!
          if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl)
          }
          this.audioUrl = URL.createObjectURL(blob)

          // Update audio source
          if (this.audio) {
            this.audio.src = this.audioUrl
            this.audio.load()
            this.audio.addEventListener(
              "loadedmetadata",
              () => {
                if (this.audio) {
                  this.calculateWordTimestamps(this.audio.duration)
                }
              },
              { once: true },
            )
          }

          return true // Successfully updated
        }
      }

      // If we get here, the audio wasn't found in cache
      console.log(`No cached audio found for model ${newModel}, need to generate`)
      // Restore previous model
      this.model = previousModel
      return false
    } catch (error) {
      console.error("Error updating model:", error)
      // Restore previous model on error
      this.model = previousModel
      return false
    }
  }

  // Get preprocessing instructions
  public getPreprocessingInstructions(): string {
    return this.preprocessingInstructions
  }

  // Method to check if audio can be played
  private async canAutoplay(): Promise<boolean> {
    if (!this.audio) return false

    try {
      // Try a silent play to check if autoplay is allowed
      this.audio.volume = 0
      await this.audio.play()
      this.audio.pause()
      this.audio.volume = 1
      return true
    } catch (error) {
      console.log("Autoplay not allowed:", error)
      return false
    }
  }

  // Start speaking
  public async speak(startWordIndex = 0): Promise<void> {
    if (!this.audio || !this.audioUrl) {
      throw new Error("Audio not prepared yet")
    }

    this.currentWordIndex = startWordIndex

    // Update the word index callback
    if (this.onWordChange) {
      this.onWordChange(startWordIndex)
    }

    // Set position based on word timestamps
    if (startWordIndex > 0 && this.wordTimestamps.length > startWordIndex) {
      // Use the calculated timestamp for this word
      this.audio.currentTime = this.wordTimestamps[startWordIndex]
      console.log(`Starting from word ${startWordIndex} at time ${this.wordTimestamps[startWordIndex]}s`)
    } else {
      this.audio.currentTime = 0
    }

    try {
      // Check if autoplay is allowed
      const canAutoplay = await this.canAutoplay()

      if (!canAutoplay) {
        console.log("Autoplay blocked by browser. Showing download option.")
        if (this.onAutoplayBlocked) {
          this.onAutoplayBlocked()
        }
        return
      }

      // Try to play the audio
      await this.audio.play()
      console.log("Audio playback started successfully")
      this.isPlaying = true
    } catch (error: any) {
      console.error("Audio playback failed:", error)

      // If autoplay is prevented, trigger the callback
      if (error.name === "NotAllowedError") {
        console.log("Autoplay prevented. Offering download instead.")
        if (this.onAutoplayBlocked) {
          this.onAutoplayBlocked()
        }
      }

      throw error
    }
  }

  // Download the audio file
  public downloadAudio(): void {
    if (!this.audioUrl) return

    const a = document.createElement("a")
    a.href = this.audioUrl
    a.download = "samantha-audio.mp3"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Start tracking words based on audio playback time
  private startWordTracking(): void {
    if (this.wordUpdateInterval) {
      clearInterval(this.wordUpdateInterval)
    }

    // Keep this for smoother updates
    this.wordUpdateInterval = setInterval(() => {
      if (!this.audio || !this.isPlaying) return
      this.updateCurrentWord()
    }, 50) // Update every 50ms for smooth tracking
  }

  // Stop tracking words
  private stopWordTracking(): void {
    if (this.wordUpdateInterval) {
      clearInterval(this.wordUpdateInterval)
      this.wordUpdateInterval = null
    }
  }

  // Pause speaking
  public pause(): void {
    if (this.audio && this.isPlaying) {
      this.audio.pause()
      this.isPlaying = false
    }
  }

  // Resume speaking
  public resume(): void {
    if (this.audio && !this.isPlaying) {
      this.audio.play().catch((error) => {
        console.error("Error resuming audio:", error)

        // If autoplay is prevented, offer a download link
        if (error.name === "NotAllowedError") {
          console.log("Autoplay prevented. Offering download instead.")
          if (this.onAutoplayBlocked) {
            this.onAutoplayBlocked()
          }
        }
      })
      this.isPlaying = true
    }
  }

  // Stop speaking
  public stop(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
      this.isPlaying = false
      this.stopWordTracking()
    }
  }

  // Check if speaking
  public isSpeaking(): boolean {
    return this.isPlaying
  }

  // Set voice (nova, alloy, echo, fable, onyx, shimmer)
  public setVoice(voice: string): void {
    this.voice = voice
  }

  // Set speed (0.25 to 4.0)
  public setSpeed(speed: number): void {
    if (speed < 0.25) speed = 0.25
    if (speed > 4.0) speed = 4.0
    this.speed = speed
  }

  // Set model (only tts-1 supported for cost-effectiveness)
  public setModel(model: string): void {
    // Always use tts-1 (cost-effective model)
    this.model = "tts-1"
  }

  // Get current settings
  public getSettings(): { voice: string; speed: number; model: string } {
    return {
      voice: this.voice,
      speed: this.speed,
      model: this.model,
    }
  }

  // Get current playback time in seconds
  public getCurrentTime(): number {
    return this.audio?.currentTime || 0
  }

  // Get audio duration in seconds
  public getDuration(): number {
    return this.audio?.duration || 0
  }

  // Set current playback time
  public setCurrentTime(time: number): void {
    if (this.audio) {
      this.audio.currentTime = time
    }
  }

  // Check if audio is paused
  public isPaused(): boolean {
    return this.audio?.paused ?? true
  }

  // Clean up resources
  public cleanup(): void {
    this.stop()
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl)
      this.audioUrl = null
    }
  }

  // Get current word index
  public getCurrentWordIndex(): number {
    return this.currentWordIndex;
  }

  // Get audio URL
  public getAudioUrl(): string | null {
    return this.audioUrl
  }
}

// Create a singleton instance
let openAITTSServiceInstance: OpenAITTSService | null = null

export function getOpenAITTSService(): OpenAITTSService {
  if (!openAITTSServiceInstance && typeof window !== "undefined") {
    openAITTSServiceInstance = new OpenAITTSService()
  }
  return openAITTSServiceInstance as OpenAITTSService
}
