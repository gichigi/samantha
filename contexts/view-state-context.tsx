"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type ViewState = "home" | "loading" | "reading"

interface ViewStateContextProps {
  viewState: ViewState
  isFadingOut: boolean
  setViewState: (state: ViewState) => void
  transitionTo: (newState: ViewState, withFade?: boolean) => void
}

const ViewStateContext = createContext<ViewStateContextProps | undefined>(undefined)

export function ViewStateProvider({ children }: { children: ReactNode }) {
  const [viewState, setViewState] = useState<ViewState>("home")
  const [isFadingOut, setIsFadingOut] = useState(false)

  const transitionTo = (newState: ViewState, withFade = false) => {
    if (withFade) {
      setIsFadingOut(true)
      setTimeout(() => {
        setViewState(newState)
        setIsFadingOut(false)
      }, 500) // Match this with the CSS transition duration
    } else {
      setViewState(newState)
    }
  }

  const value = {
    viewState,
    isFadingOut,
    setViewState,
    transitionTo,
  }

  return <ViewStateContext.Provider value={value}>{children}</ViewStateContext.Provider>
}

export function useViewState() {
  const context = useContext(ViewStateContext)
  if (context === undefined) {
    throw new Error("useViewState must be used within a ViewStateProvider")
  }
  return context
}
