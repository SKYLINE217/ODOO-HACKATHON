import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/auth/callback']

// Role-based access control
const ROLE_ROUTES: Record<string, string[]> = {
  '/approvals': ['admin', 'manager'],
  '/reports': ['admin', 'procurement_officer', 'manager'],
  '/vendors': ['admin', 'procurement_officer'],
  '/activity': ['admin', 'procurement_officer', 'manager'],
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return response
  }

  try {
    // ── 1. Check for bypass session cookie (demo accounts) ─────────────────
    const bypassCookie = request.cookies.get('sb-bypass-session')?.value
    let localUser: { role?: string; id?: string } | null = null

    if (bypassCookie) {
      try {
        localUser = JSON.parse(decodeURIComponent(bypassCookie))
      } catch {
        // Malformed cookie — ignore, treat as unauthenticated
      }
    }

    const hasSession = !!localUser

    // ── 2. Auth guards ──────────────────────────────────────────────────────
    const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

    // Unauthenticated → redirect to login
    if (!hasSession && !isPublicRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Authenticated on a public route → redirect to dashboard
    if (hasSession && isPublicRoute) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Role-based access control
    if (hasSession && localUser?.role) {
      for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
        if (pathname.startsWith(route) && !allowedRoles.includes(localUser.role!)) {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }
    }
  } catch {
    // Auth check failed — allow request to proceed (avoids lockout loops)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
