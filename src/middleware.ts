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

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value: '', ...options })
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
    let localUser = null
    if (bypassCookie) {
      try {
        localUser = JSON.parse(decodeURIComponent(bypassCookie))
      } catch (e) {
        console.warn('Failed to parse bypass cookie', e)
      }
    }

    // Note: getUser() is secure and verifies the JWT signature
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

      if (localUser) {
        userRole = localUser.role
      } else if (user) {
        // Fetch user role from profiles
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (!error && profile) {
          userRole = profile.role
        }
      }

      if (userRole) {
        for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
          if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
            // Redirect unauthorized users to root
            return NextResponse.redirect(new URL('/', request.url))
          }
        }
      }
    }
  } catch (err) {
    console.error('Middleware auth check error:', err)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
