/**
 * Skool-Claim-Endpoint.
 *
 * POST /api/invite/skool/claim  { token }
 *
 * 1. Token validieren (nicht abgelaufen, vorhanden)
 * 2. Auth-User finden oder anlegen (mit email_confirm)
 * 3. Community-Member claimen + Plan S aktivieren (via claimCommunityMember)
 * 4. Magic-Link per Mail an User schicken (so kommt er rein)
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  claimCommunityMember,
  getCommunityMemberByToken,
} from '@/lib/skool-sync'
import { sendInvitationEmail } from '@/lib/invitations'

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

  // 1. Auth-User finden oder anlegen
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

  // 2. Claim: profile_id setzen, Plan S aktivieren wenn Skool-Zugang noch läuft
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

  // 3. Magic-Login-Link per Mail schicken
  const emailRes = await sendInvitationEmail(admin, email)
  if (!emailRes.ok) {
    return NextResponse.json({ error: emailRes.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
