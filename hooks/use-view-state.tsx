"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type ViewState = "home" | "loading" | "reading"

interface ViewStateContextProps {
  viewState: ViewState
  isFadingOut: boolean
  isFadingIn: boolean
  setViewState: (state: ViewState) => void
  transitionTo: (newState: ViewState, withFade?: boolean) => void
}

const ViewStateContext = createContext<ViewStateContextProps | undefined>(undefined)

export function ViewStateProvider({ children }: { children: ReactNode }) {
  const [viewState, setViewState] = useState<ViewState>("home")
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [isFadingIn, setIsFadingIn] = useState(false)

  const transitionTo = (newState: ViewState, withFade = false) => {
    if (withFade) {
      setIsFadingOut(true)
      setTimeout(() => {
        setViewState(newState)
        setIsFadingOut(false)
        setIsFadingIn(true)
        setTimeout(() => {
          setIsFadingIn(false)
        }, 500) // Fade-in duration
      }, 500) // Match this with the CSS transition duration
    } else {
      setViewState(newState)
      setIsFadingIn(true)
      setTimeout(() => {
        setIsFadingIn(false)
      }, 500) // Fade-in duration
    }
  }

  const value = {
    viewState,
    isFadingOut,
    isFadingIn,
    setViewState,
    transitionTo,
  }

  return (
    <ViewStateContext.Provider value={value}>
      {children}
    </ViewStateContext.Provider>
  )
}

export function useViewState() {
  const context = useContext(ViewStateContext)
  if (context === undefined) {
    throw new Error("useViewState must be used within a ViewStateProvider")
  }
  return context
}
