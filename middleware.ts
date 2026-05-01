import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/auth'

const PUBLIC_PATHS = ['/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  const token = req.cookies.get('auth-token')?.value
  const session = token ? await verifyToken(token) : null

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
   if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  if (session && isPublic) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}