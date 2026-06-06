import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/auth/callback']

// Route permissions mapping path -> allowed roles
const ROLE_ROUTES: Record<string, string[]> = {
  '/approvals': ['admin', 'manager'],
  '/reports': ['admin', 'procurement_officer', 'manager'],
  '/vendors': ['admin', 'procurement_officer'],
  '/activity': ['admin', 'procurement_officer', 'manager'],
}

function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname

  // Skip middleware check for static resources and API calls
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return response
  }

  try {
    // Check for bypass session cookie
    const bypassCookie = request.cookies.get('sb-bypass-session')?.value
    let localUser: { role?: string; id?: string } | null = null
    if (bypassCookie) {
      try {
        localUser = JSON.parse(decodeURIComponent(bypassCookie))
      } catch {
        // Malformed — ignore
      }
    } else {
      // Look for real Supabase session cookies
      let token: string | undefined;
      for (const cookie of request.cookies.getAll()) {
        if (cookie.name === 'sb-access-token') {
          token = cookie.value;
          break;
        }
        if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
          try {
            const parsed = JSON.parse(decodeURIComponent(cookie.value));
            if (Array.isArray(parsed) && parsed[0]) {
              token = parsed[0];
            } else if (parsed && parsed.access_token) {
              token = parsed.access_token;
            }
          } catch {
            token = cookie.value;
          }
          break;
        }
      }

      if (token) {
        const decoded = decodeJwt(token);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          localUser = {
            id: decoded.sub,
            role: decoded.user_metadata?.role || decoded.app_metadata?.role || 'procurement_officer',
          };
        }
      }
    }

    const hasSession = !!localUser

    // Redirect unauthenticated users to login
    if (!hasSession && !PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
      const url = new URL('/login', request.url)
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from auth pages
    if (hasSession && PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Role-based route protection
    if (hasSession && localUser?.role) {
      const userRole = localUser.role
      for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
        if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }
    }
  } catch {
    // Auth check failed — allow request to proceed (avoids lock-out loops)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
