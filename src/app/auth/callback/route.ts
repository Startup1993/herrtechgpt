import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { linkUserToCommunityMember } from '@/lib/skool-sync'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

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
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Self-Service-Login via signInWithOtp (PKCE-Flow, Code-Exchange)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      await tryAutoLinkSkoolMember()
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
