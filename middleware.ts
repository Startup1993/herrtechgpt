import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Nicht-eingeloggte User → Login ──────────────────────────────────────
  if (!user && (pathname.startsWith('/assistants') || pathname.startsWith('/admin') || pathname.startsWith('/dashboard'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── Admin-Routen: nur Admins ───────────────────────────────────────────
  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile || profile.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // ── /assistants: nur Premium + Admin ───────────────────────────────────
  if (user && pathname.startsWith('/assistants')) {
    // Onboarding-Page ist auch für basic erlaubt (damit sie den Quiz machen können)
    if (pathname.startsWith('/assistants/onboarding')) {
      return supabaseResponse
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, access_tier')
      .eq('id', user.id)
      .single()

    const isPremium = profile?.access_tier === 'premium' || profile?.role === 'admin'

    if (!isPremium) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/upgrade'
      return NextResponse.redirect(url)
    }
  }

  // ── Eingeloggte User weg von login/signup ──────────────────────────────
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
