"use client"

import { ReaderProvider } from "@/contexts/reader-context"
import { ViewStateProvider, useViewState } from "@/hooks/use-view-state"
import HomeView from "@/components/views/home-view"
import LoadingView from "@/components/views/loading-view"
import ReaderView from "@/components/views/reader-view"

// Inner component that uses the context
function AppContent() {
  const { viewState } = useViewState()

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
