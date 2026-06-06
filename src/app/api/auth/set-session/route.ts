import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/set-session
// Sets the bypass session cookie server-side — more reliable than document.cookie on Vercel HTTPS
export async function POST(request: NextRequest) {
  try {
    const profile = await request.json()

    if (!profile?.id || !profile?.role) {
      return NextResponse.json({ error: 'Invalid profile' }, { status: 400 })
    }

    const response = NextResponse.json({ ok: true })

    // Set cookie server-side — guarantees correct attributes on HTTPS
    response.cookies.set('sb-bypass-session', encodeURIComponent(JSON.stringify(profile)), {
      path: '/',
      maxAge: 86400,
      httpOnly: false,       // Must be false so client JS (useAuth) can read it
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production', // Secure only on HTTPS
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Failed to set session' }, { status: 500 })
  }
}

// DELETE /api/auth/set-session
// Clears the bypass session cookie
export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('sb-bypass-session', '', {
    path: '/',
    maxAge: 0,
    httpOnly: false,
    sameSite: 'lax',
  })
  return response
}
