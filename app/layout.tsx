import type React from "react"
import "./globals.css"
import type { Metadata, Viewport } from "next"
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

// Viewport configuration for PWA
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#3b82f6',
}

// Setup metadata for social sharing and SEO
export const metadata: Metadata = {
  title: 'Samantha — Your reading companion who brings articles to life',
  description: 'Turn any article into a warm, engaging listening experience. Samantha transforms web content into natural speech with personality. Free, no sign-ups, powered by OpenAI.',
  keywords: ['text to speech', 'article reader', 'TTS', 'audio articles', 'listen to articles', 'OpenAI TTS', 'web reader', 'accessibility', 'Her movie', 'AI voice', 'natural voice', 'article narration'],
  authors: [{ name: 'Samantha' }],
  creator: 'Samantha',
  publisher: 'Samantha',
  metadataBase: new URL('https://samantha.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Samantha — Your reading companion who brings articles to life',
    description: 'Turn any article into a warm, engaging listening experience. Free text-to-speech with personality, inspired by "Her".',
    url: 'https://samantha.vercel.app',
    siteName: 'Samantha',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Samantha - A warm, curious AI companion who reads the internet to you',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Samantha — Your reading companion who brings articles to life',
    description: 'Turn any article into a warm, engaging listening experience. Free text-to-speech with personality.',
    creator: '@samantha',
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.png',
    apple: '/images/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Samantha',
    description: 'Turn any article into a warm, engaging listening experience with AI-powered text-to-speech',
    url: 'https://samantha.vercel.app',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Text-to-speech conversion',
      'Natural AI voice',
      'Zero-text universal interface',
      'No authentication required',
      'URL content extraction',
    ],
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
