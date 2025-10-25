import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Performance headers for all requests
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Cache control for static assets
  if (request.nextUrl.pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  // Cache control for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Dashboard API gets special caching
    if (request.nextUrl.pathname === '/api/dashboard') {
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    } else {
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    }
  }

  // Preload hints for critical resources
  if (request.nextUrl.pathname === '/') {
    response.headers.set('Link', [
      '</api/dashboard>; rel=preload; as=fetch; crossorigin=anonymous',
      '</_next/static/css/app/globals.css>; rel=preload; as=style',
      '<https://fonts.googleapis.com>; rel=preconnect',
      '<https://fonts.gstatic.com>; rel=preconnect; crossorigin'
    ].join(', '))
  }

  // Compression hint
  response.headers.set('Accept-Encoding', 'gzip, deflate, br')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}