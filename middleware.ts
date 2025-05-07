import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Log the request path and method
  console.log(`Request: ${request.method} ${request.nextUrl.pathname}`)

  // Log headers (excluding sensitive ones)
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    if (!key.toLowerCase().includes("authorization") && !key.toLowerCase().includes("cookie")) {
      headers[key] = value
    }
  })
  console.log("Request headers:", headers)

  // Continue to the next middleware or route handler
  const response = NextResponse.next()

  // Add a response handler
  response.headers.set("x-middleware-cache", "no-cache")

  return response
}

// Only run the middleware on API routes
export const config = {
  matcher: "/api/:path*",
}
