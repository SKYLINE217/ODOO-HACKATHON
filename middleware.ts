import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Middleware bypassed completely for hardcoded demo to ensure no Vercel edge/cookie issues.
  // The client-side DashboardGuard in layout.tsx will handle redirecting unauthenticated users.
  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
