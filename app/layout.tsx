import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
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

// Setup metadata for social sharing and SEO
export const metadata: Metadata = {
  title: 'Samantha - She reads the internet, out loud, just for you',
  description: 'A text-to-speech reading app inspired by the movie Her. Zero-text UI, powered by OpenAI. No authentication required.',
  metadataBase: new URL('https://samantha.vercel.app'),
  openGraph: {
    title: 'Samantha - She reads the internet, out loud, just for you',
    description: 'A text-to-speech reading app inspired by the movie Her. Zero-text UI, powered by OpenAI.',
    url: 'https://samantha.vercel.app',
    siteName: 'Samantha',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Samantha - She reads the internet, out loud',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Samantha - She reads the internet, out loud',
    description: 'A text-to-speech reading app inspired by the movie Her. Zero-text UI, powered by OpenAI.',
    images: ['/images/og-image.jpg'],
  },
  icons: {
    icon: '/images/favicon.svg',
    shortcut: '/images/favicon.svg',
    apple: '/images/apple-touch-icon.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <ViewStateProvider>
          <ReaderProvider>
            <Navbar />
            {children}
          </ReaderProvider>
        </ViewStateProvider>
      </body>
    </html>
  )
}
