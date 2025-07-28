"use client"

import { useState, useEffect } from "react"
import { BookOpen, Brain, Sparkles, History } from "lucide-react"
import TextCard from "@/components/text-card"
import UrlInput from "@/components/url-input"
import { LoginForm } from "@/components/login-form"
import Link from "next/link"
import { sampleTexts } from "@/data/sample-texts"
import { useReader } from "@/contexts/reader-context"
import { useUrlExtraction } from "@/hooks/use-url-extraction"
import { useViewState } from "@/hooks/use-view-state"
import { useAuth } from "@/contexts/auth-context"

export default function HomeView() {
  const {
    setCurrentTextIndex,
    setCurrentTitle,
    setCurrentUrl,
    setUseTimestampHighlighting,
    setAudioUrl,
    setCurrentText,
  } = useReader()

  const { transitionTo } = useViewState()
  const { isLoading, extractUrl, error: extractionError } = useUrlExtraction()
  const { user, isLoading: authLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)

  // Listen for auth prompt trigger from navbar
  useEffect(() => {
    const handleAuthPromptTrigger = () => {
      if (!user) {
        setShowAuthPrompt(true)
        setError(null)
      }
    }

    window.addEventListener('trigger-auth-prompt', handleAuthPromptTrigger)
    return () => window.removeEventListener('trigger-auth-prompt', handleAuthPromptTrigger)
  }, [user])

  // Hide auth prompt when user logs in
  useEffect(() => {
    if (user) {
      setShowAuthPrompt(false)
      setError(null)
    }
  }, [user])

  const handleSelectSampleText = (index: number) => {
    // For all sample texts, use timestamp-based highlighting
    transitionTo("loading")
    setUseTimestampHighlighting(true)

    // Set the current text content
    setCurrentText(sampleTexts[index].content)

    // Set the current text index and title immediately
    setCurrentTextIndex(index)
    setCurrentTitle(sampleTexts[index].title)

    // Set the appropriate Supabase audio URL based on the index
    let audioUrl = ""
    switch (index) {
      case 0:
        audioUrl =
          "https://aofhjlkcmpalyjjzlsam.supabase.co/storage/v1/object/public/audio/introduction-to-samantha.mp3"
        break
      case 1:
        audioUrl =
          "https://aofhjlkcmpalyjjzlsam.supabase.co/storage/v1/object/public/audio/The-Future-of-Artificial-Intelligence.mp3"
        break
      case 2:
        audioUrl = "https://aofhjlkcmpalyjjzlsam.supabase.co/storage/v1/object/public/audio/The-Art-of-Mindfulness.mp3"
        break
      case 3:
        audioUrl =
          "https://aofhjlkcmpalyjjzlsam.supabase.co/storage/v1/object/public/audio/The-History-of-the-Internet.mp3"
        break
      default:
        // Fall back to regular TTS for any other index
        setUseTimestampHighlighting(false)
        return
    }

    // Fix any double slashes in URLs
    audioUrl = audioUrl.replace(/([^:]\/)\/+/g, "$1");

    console.log("Loading sample audio:", audioUrl);
    
    // Use a pre-loading approach that keeps user on loading screen
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Create audio element to pre-load
    const audio = document.createElement('audio');
    
    // Set up a timeout for loading
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn("Audio loading timeout - taking too long to load");
        setError("Audio file is taking too long to load. Falling back to text-to-speech.");
        setUseTimestampHighlighting(false);
        transitionTo("home");
      }
    }, 15000); // 15 second timeout
    
    // Success handler - audio is ready
    audio.oncanplaythrough = () => {
      if (!isMounted) return;
      
      if (timeoutId) clearTimeout(timeoutId);
      console.log("Audio file loaded successfully");
      
      // Set audio URL only after it's fully loaded
      setAudioUrl(audioUrl);

      // Transition to reading view only after audio is ready
      transitionTo("reading");
    };
    
    // Generic error handler
    audio.onerror = () => {
      if (!isMounted) return;
      
      if (timeoutId) clearTimeout(timeoutId);
      
      console.error("Failed to load sample audio:", {
        source: audioUrl,
        errorType: "load_failure"
      });
      
      setError("Unable to load audio. Please try again or select a different article.");
      transitionTo("home");
    };
    
    // Set attributes and begin loading
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.src = audioUrl;
    
    try {
      audio.load();
      console.log("Started loading audio file:", audioUrl);
    } catch (e) {
      console.error("Exception during sample audio loading:", e);
      setError(`Error loading audio: ${(e as Error)?.message || "Unknown error"}`);
      if (timeoutId) clearTimeout(timeoutId);
      transitionTo("home");
    }
    
    // Add cleanup to window object
    window.__audioCleanup = () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      audio.oncanplaythrough = null;
      audio.onerror = null;
      audio.src = "";
    };
  }

  const handleUrlSubmit = async (url: string) => {
    // Check if user is authenticated
    if (!user) {
      setShowAuthPrompt(true)
      setError(null) // Don't show error, just show login form
      return
    }

    transitionTo("loading")
    setError(null)
    setShowAuthPrompt(false)

    const extractedData = await extractUrl(url)

    if (extractedData) {
      setCurrentTitle(extractedData.title)
      setCurrentUrl(url)
      setCurrentText(extractedData.content)
      setUseTimestampHighlighting(false)

      // Set audio URL to null for TTS-generated audio
      setAudioUrl(null);

      // Transition to reading view
      transitionTo("reading")
    } else {
      // Handle specific extraction errors with user-friendly messages
      if (extractionError) {
        if (extractionError.code === "AUTHENTICATION_REQUIRED") {
          setShowAuthPrompt(true)
          setError("Please sign in to continue")
        } else if (extractionError.code === "USAGE_LIMIT_EXCEEDED") {
          setError(`Daily limit reached! ${extractionError.suggestion}`)
        } else if (extractionError.code === "UNSUPPORTED_FILE_TYPE") {
          setError("Can't read this file type. Try copying a web article URL instead.")
        } else if (extractionError.code === "CONTENT_TOO_LONG") {
          setError("This article is too long. Please try a shorter article (under 10,000 words).")
        } else if (extractionError.code === "INVALID_URL") {
          setError("Invalid URL. Please paste a complete web address (like https://example.com/article).")
        } else {
          setError("Couldn't extract this content. Please try a different article URL.")
        }
      }
      
      // If extraction failed, go back to home
      transitionTo("home")
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#3b82f6] p-6">
      <div className="flex flex-col items-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 tracking-tight">Samantha</h1>
        <p className="text-white/80 text-center max-w-md font-normal text-lg">
        She reads the internet, out loud, just for you.
      </p>
      </div>

      {error && (
        <div className="bg-red-500/20 p-4 rounded-lg max-w-md text-center mb-8">
          <p className="text-white">{error}</p>
        </div>
      )}

      {/* Show login form if auth is required */}
      {showAuthPrompt && !user ? (
        <div className="w-full max-w-md mb-8">
          <LoginForm />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl mb-10">
            <TextCard
              title="Introduction"
              icon={<BookOpen />}
              wordCount={sampleTexts[0].wordCount}
              readingTime={sampleTexts[0].readingTime}
              onClick={() => handleSelectSampleText(0)}
            />
            <TextCard
              title="AI Future"
              icon={<Brain />}
              wordCount={sampleTexts[1].wordCount}
              readingTime={sampleTexts[1].readingTime}
              onClick={() => handleSelectSampleText(1)}
            />
            <TextCard
              title="Mindfulness"
              icon={<Sparkles />}
              wordCount={sampleTexts[2].wordCount}
              readingTime={sampleTexts[2].readingTime}
              onClick={() => handleSelectSampleText(2)}
            />
            <TextCard
              title="Internet History"
              icon={<History />}
              wordCount={sampleTexts[3].wordCount}
              readingTime={sampleTexts[3].readingTime}
              onClick={() => handleSelectSampleText(3)}
            />
          </div>

          <div className="w-full max-w-xl">
            <UrlInput onSubmit={handleUrlSubmit} isLoading={isLoading} />
          </div>
        </>
      )}
    </main>
  )
}
