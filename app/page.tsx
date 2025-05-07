"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ReaderProvider } from "@/contexts/reader-context"
import { ViewStateProvider, useViewState } from "@/hooks/use-view-state"
import HomeView from "@/components/views/home-view"
import LoadingView from "@/components/views/loading-view"
import ReaderView from "@/components/views/reader-view"
import { getReadingTrackerService } from "@/services/reading-tracker-service"

// Inner component that uses the context
function AppContent() {
  const { viewState } = useViewState()
  const { user } = useAuth()

  // Update reading tracker authentication status when user changes
  useEffect(() => {
    const readingTracker = getReadingTrackerService()
    readingTracker.setAuthenticated(!!user)
  }, [user])

  return (
    <>
      {viewState === "home" && <HomeView />}
      {viewState === "loading" && <LoadingView />}
      {viewState === "reading" && <ReaderView />}
    </>
  )
}

// Main component that provides the contexts
export default function Home() {
  return (
    <ViewStateProvider>
      <ReaderProvider>
        <AppContent />
      </ReaderProvider>
    </ViewStateProvider>
  )
}
