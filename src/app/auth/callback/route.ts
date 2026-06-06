import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Redirect to dashboard — session cookies are now set server-side
      // Add ?from=oauth so the dashboard layout knows a fresh OAuth login just happened
      const redirectUrl = `${origin}${next}${next.includes('?') ? '&' : '?'}from=oauth`
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Exchange failed
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
