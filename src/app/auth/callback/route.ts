import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { linkUserToCommunityMember } from '@/lib/skool-sync'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Auto-Link nach erfolgreichem Login: prüft ob es einen unclaimed
 * community_member mit der Email gibt und claimt ihn (Plan S / alumni).
 * Idempotent — Fehler hier dürfen den Login NIE blockieren.
 */
async function tryAutoLinkSkoolMember() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return
    const admin = createAdminClient()
    await linkUserToCommunityMember(admin, { userId: user.id, email: user.email })
  } catch (err) {
    console.error('[auth-callback] Skool-Auto-Link fehlgeschlagen:', err)
  }
}

/**
 * Wohin redirecten wir nach erfolgreichem Auth?
 *
 * Wir wollen den Welcome-Screen NUR bei Erst-Registrierung zeigen, nicht
 * bei jedem Login. Indikator: profiles.welcomed_at IS NULL.
 *
 * - welcomed_at IS NULL → User klickt zum ersten Mal auf Magic-Link →
 *   /welcome (dort wird welcomed_at gesetzt beim "Los geht's"-Klick)
 * - welcomed_at gesetzt → User loggt sich ein → /dashboard direkt
 *
 * Falls die Page einen expliziten next-Param mitschickt (z.B. nach
 * Invite oder Deep-Link), respektieren wir den. Default-Routes
 * /welcome und /dashboard werden gegen welcomed_at re-evaluiert.
 */
async function resolveRedirectAfterAuth(
  supabase: SupabaseClient,
  explicitNext: string
): Promise<string> {
  const isDefaultNext = explicitNext === '/welcome' || explicitNext === '/dashboard'

  // Expliziter Deep-Link (nicht /welcome oder /dashboard) hat Vorrang
  if (!isDefaultNext) return explicitNext

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return explicitNext

    const { data: profile } = await supabase
      .from('profiles')
      .select('welcomed_at')
      .eq('id', user.id)
      .maybeSingle()

    // Erst-Registrierung → Welcome-Screen einmalig
    if (!profile?.welcomed_at) return '/welcome'

    // Existierender User → direkt aufs Dashboard
    return '/dashboard'
  } catch {
    return explicitNext
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  // Admin-Einladungen: verifizieren via token_hash (setzt Session serverseitig in Cookies)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      await tryAutoLinkSkoolMember()
      const target = await resolveRedirectAfterAuth(supabase, next)
      return NextResponse.redirect(`${origin}${target}`)
    }
  }

  // Self-Service-Login via signInWithOtp (PKCE-Flow, Code-Exchange)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      await tryAutoLinkSkoolMember()
      const target = await resolveRedirectAfterAuth(supabase, next)
      return NextResponse.redirect(`${origin}${target}`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
