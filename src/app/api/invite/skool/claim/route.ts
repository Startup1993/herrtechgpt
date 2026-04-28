/**
 * Skool-Claim-Endpoint.
 *
 * POST /api/invite/skool/claim  { token }
 *
 * 1. Token validieren (nicht abgelaufen, vorhanden)
 * 2. Auth-User finden oder anlegen (mit email_confirm)
 * 3. Community-Member claimen + Plan S / alumni-Tier aktivieren
 * 4. Magic-Link generieren und als redirect-URL zurückgeben →
 *    Frontend redirected sofort dorthin → User ist direkt eingeloggt.
 *    (Keine zweite Mail nötig.)
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  claimCommunityMember,
  getCommunityMemberByToken,
} from '@/lib/skool-sync'
import { PRODUCTION_URL } from '@/lib/urls'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { token?: string } | null
  const token = typeof body?.token === 'string' ? body.token.trim() : ''
  if (!token) {
    return NextResponse.json({ error: 'Token fehlt' }, { status: 400 })
  }

  const admin = createAdminClient()
  const member = await getCommunityMemberByToken(admin, token)
  if (!member) {
    return NextResponse.json(
      { error: 'Einladung ungültig oder abgelaufen' },
      { status: 404 }
    )
  }

  const email = member.email.toLowerCase()

  // 1. Auth-User finden oder anlegen (Name aus community_member übernehmen)
  let userId: string | null = member.profile_id
  if (!userId) {
    const { data: page } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const existing = page?.users?.find((u) => u.email?.toLowerCase() === email)
    if (existing) {
      userId = existing.id
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: member.name ? { full_name: member.name } : undefined,
      })
      if (createErr || !created.user) {
        return NextResponse.json(
          { error: createErr?.message ?? 'User-Anlage fehlgeschlagen' },
          { status: 500 }
        )
      }
      userId = created.user.id
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'User-ID nicht ermittelbar' }, { status: 500 })
  }

  // Profil mit Name befüllen, falls noch leer
  if (member.name) {
    await admin
      .from('profiles')
      .update({ full_name: member.name })
      .eq('id', userId)
      .is('full_name', null)
  }

  // 2. Claim: profile_id setzen, Plan S / alumni-Tier aktivieren
  try {
    await claimCommunityMember(admin, {
      communityMemberId: member.id,
      profileId: userId,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Claim fehlgeschlagen' },
      { status: 500 }
    )
  }

  // 3. Magic-Link generieren und als redirect-URL zurückgeben.
  //    Frontend macht window.location.href = redirectTo → User ist sofort drin.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  const hashedToken = linkData?.properties?.hashed_token
  if (linkErr || !hashedToken) {
    // Sollte fast nie passieren — Fallback: schicke 'ok' ohne redirect,
    // Frontend zeigt dann Hinweis "Einloggen über /login"
    return NextResponse.json({
      ok: true,
      warning: linkErr?.message ?? 'Magic-Link konnte nicht generiert werden',
    })
  }

  const params = new URLSearchParams({
    token_hash: hashedToken,
    type: 'magiclink',
    next: '/dashboard',
  })
  const redirectTo = `${PRODUCTION_URL}/auth/callback?${params.toString()}`

  return NextResponse.json({ ok: true, redirectTo })
}
