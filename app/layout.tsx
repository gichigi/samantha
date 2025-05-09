import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/contexts/auth-context"
import { ReaderProvider } from "@/contexts/reader-context"
import { ViewStateProvider } from "@/contexts/view-state-context"
import Navbar from "@/components/navbar"

// Load Inter with specific weights for better text rendering
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Samantha - Your AI Reading Assistant",
  description: "Listen to any article read aloud with a natural voice",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <AuthProvider>
          <ViewStateProvider>
            <ReaderProvider>
              <Navbar />
          {children}
            </ReaderProvider>
          </ViewStateProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
