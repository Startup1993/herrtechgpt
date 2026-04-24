import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import { getFeatureState, requiresUpgrade, type FeatureKey } from '@/lib/permissions'

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

  // ── Nicht-eingeloggte User → /coming-soon (außer /admin → /login) ──────
  // Admin-Routen gehen auf /login, damit Team direkt einloggen kann.
  // Alle anderen geschützten Routen leiten auf die Marketing-Landing.
  if (!user && pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  if (!user && (pathname.startsWith('/assistants') || pathname.startsWith('/dashboard'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/coming-soon'
    return NextResponse.redirect(url)
  }

  // ── /welcome benötigt Login (sonst kann man Screen als Gast sehen) ─────
  if (!user && pathname.startsWith('/welcome')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── Alte /assistants Routen → Redirect auf neue /dashboard Routen ──────
  if (user && pathname.startsWith('/assistants')) {
    const url = request.nextUrl.clone()

    if (pathname.startsWith('/assistants/onboarding')) {
      url.pathname = '/dashboard/onboarding'
    } else if (pathname.startsWith('/assistants/workflows/carousel')) {
      url.pathname = '/dashboard/ki-toolbox/carousel'
    } else if (pathname.startsWith('/assistants/workflows/video-editor')) {
      url.pathname = '/dashboard/ki-toolbox/video-editor'
    } else if (pathname.startsWith('/assistants/chat')) {
      url.pathname = '/dashboard/herr-tech-gpt'
    } else if (pathname.startsWith('/assistants/path')) {
      url.pathname = '/dashboard/path'
    } else if (pathname.startsWith('/assistants/library')) {
      url.pathname = '/dashboard/herr-tech-gpt'
    } else if (pathname.startsWith('/assistants/profile')) {
      url.pathname = '/dashboard/account'
    } else if (pathname.startsWith('/assistants/admin/knowledge')) {
      url.pathname = pathname.replace('/assistants/admin/knowledge', '/admin/content/knowledge')
    } else if (pathname.startsWith('/assistants/admin/tools')) {
      url.pathname = pathname.replace('/assistants/admin/tools', '/admin/content/tools')
    } else if (pathname.startsWith('/assistants/admin')) {
      url.pathname = pathname.replace('/assistants/admin', '/admin')
    } else {
      url.pathname = '/dashboard'
    }

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

  // ── Tier-Gating via feature_permissions-Matrix ──
  //    'community' → Redirect auf /upgrade (Tier reicht nicht)
  //    'paid' (Abo-Zugriff) + 'open' + 'coming_soon' → durchlassen,
  //      UI-Gate übernimmt die Aktions-Sperre bei fehlender Subscription
  const gatedFeature: FeatureKey | null =
    pathname.startsWith('/dashboard/herr-tech-gpt') ? 'chat' :
    pathname.startsWith('/dashboard/ki-toolbox')   ? 'toolbox' :
    pathname.startsWith('/dashboard/classroom')    ? 'classroom' : null

  if (user && gatedFeature) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, access_tier')
      .eq('id', user.id)
      .single()

    const viewAsRaw = request.cookies.get(VIEW_AS_COOKIE)?.value
    const access = computeEffectiveAccess(profile, viewAsRaw)

    if (!access.isAdmin) {
      const state = await getFeatureState(supabase, access.tier, gatedFeature)
      if (requiresUpgrade(state)) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard/upgrade'
        url.searchParams.set('feature', gatedFeature)
        return NextResponse.redirect(url)
      }
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
