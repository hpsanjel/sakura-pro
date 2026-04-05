import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(req: NextRequest) {
  // Only protect dashboard routes, let API routes handle their own auth
  if (req.nextUrl.pathname.startsWith('/dashboard') && !req.nextUrl.pathname.includes('/api/')) {
    const authHeader = req.headers.get('authorization')
    const cookieHeader = req.headers.get('cookie')
    
    // Basic check - if no session cookie, redirect to signin
    if (!cookieHeader || !cookieHeader.includes('next-auth.session-token')) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*'
  ]
}
