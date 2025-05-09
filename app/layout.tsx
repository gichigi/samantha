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

// Setup metadata for social sharing and SEO
export const metadata: Metadata = {
  title: 'Samantha - Listen to articles read aloud with natural voice',
  description: 'Samantha reads articles aloud with a natural, expressive voice. Convert any article into audio and enjoy it while commuting, exercising, or relaxing.',
  metadataBase: new URL('https://samantha.vercel.app'),
  openGraph: {
    title: 'Samantha - She reads the internet, out loud, just for you',
    description: 'Transform your reading list into a personal podcast with advanced neural voice technology',
    url: 'https://samantha.vercel.app',
    siteName: 'Samantha',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Samantha - Listen to articles read aloud',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Samantha - She reads the internet, out loud',
    description: 'Transform your reading list into a personal podcast with advanced neural voice technology',
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
