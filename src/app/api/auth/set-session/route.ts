import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/set-session
// Sets the bypass session cookie AND redirects to dashboard in ONE response.
// This guarantees the cookie is committed before the browser navigates — no race condition.
export async function POST(request: NextRequest) {
  try {
    const profile = await request.json()

    if (!profile?.id || !profile?.role) {
      return NextResponse.json({ error: 'Invalid profile' }, { status: 400 })
    }

    // Redirect to dashboard — the Set-Cookie in a redirect response is guaranteed
    // to be committed before the browser follows the Location header.
    const redirectTo = profile.onboarded === false ? '/onboarding' : '/'
    const response = NextResponse.redirect(new URL(redirectTo, request.url), { status: 302 })

    response.cookies.set('sb-bypass-session', encodeURIComponent(JSON.stringify(profile)), {
      path: '/',
      maxAge: 86400,
      httpOnly: false,       // Must be false so client-side useAuth can read it via document.cookie
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Failed to set session' }, { status: 500 })
  }
}

// DELETE /api/auth/set-session — clears the bypass session cookie
export async function DELETE(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url), { status: 302 })
  response.cookies.set('sb-bypass-session', '', {
    path: '/',
    maxAge: 0,
    httpOnly: false,
    sameSite: 'lax',
  })
  return response
}
