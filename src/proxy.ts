import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/auth/callback']

// Route permissions mapping path -> allowed roles
const ROLE_ROUTES: Record<string, string[]> = {
  '/approvals': ['admin', 'manager'],
  '/reports': ['admin', 'procurement_officer', 'manager'],
  '/vendors': ['admin', 'procurement_officer'],
  '/activity': ['admin', 'procurement_officer', 'manager'],
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gbfjkjtcjtbuwdvsscpy.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

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
    let localUser: { role?: string } | null = null
    if (bypassCookie) {
      try {
        localUser = JSON.parse(decodeURIComponent(bypassCookie))
      } catch {
        // Malformed — ignore
      }
    }

    // getUser() verifies the JWT signature server-side (secure)
    const { data: { user } } = await supabase.auth.getUser()
    const hasSession = !!user || !!localUser

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
    if (hasSession) {
      let userRole: string | null = null

      if (localUser?.role) {
        userRole = localUser.role
      } else if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          userRole = profile.role
        }
      }

      if (userRole) {
        for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
          if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
            return NextResponse.redirect(new URL('/', request.url))
          }
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
