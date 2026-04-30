import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { handleAccessTierChange } from '@/lib/monetization'
import { notifyCommunityDowngrade } from '@/lib/email'
import { sendInvitationEmail, recordInvitationSent } from '@/lib/invitations'
import type { AccessTier } from '@/lib/access'

const VALID_ROLES = ['user', 'admin'] as const
const VALID_TIERS = ['basic', 'alumni', 'premium'] as const
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PROFILE_TEXT_FIELDS = [
  'background',
  'market',
  'target_audience',
  'offer',
  'experience_level',
  'primary_goal',
] as const

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return null

  return user
}

export async function POST(request: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await request.json().catch(() => null) as {
    email?: unknown
    access_tier?: unknown
    role?: unknown
    send_invite?: unknown
  } | null
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const emailRaw = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!EMAIL_REGEX.test(emailRaw)) {
    return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 })
  }
  const tier = typeof body.access_tier === 'string' && VALID_TIERS.includes(body.access_tier as AccessTier)
    ? (body.access_tier as AccessTier)
    : 'basic'
  const role = typeof body.role === 'string' && VALID_ROLES.includes(body.role as 'user' | 'admin')
    ? (body.role as 'user' | 'admin')
    : 'user'
  const sendInvite = body.send_invite !== false

  const admin = createAdminClient()

  const { data: existingPage } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existing = existingPage?.users?.find((u) => u.email?.toLowerCase() === emailRaw)
  if (existing) {
    return NextResponse.json({ error: 'Nutzer mit dieser E-Mail existiert bereits' }, { status: 409 })
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: emailRaw,
    email_confirm: true,
  })
  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? 'Anlegen fehlgeschlagen' }, { status: 500 })
  }
  const userId = created.user.id

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      role,
      access_tier: tier,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
  if (profileError) {
    return NextResponse.json({ error: `Profil-Update: ${profileError.message}` }, { status: 500 })
  }

  let inviteSent = false
  let inviteError: string | null = null
  if (sendInvite) {
    const res = await sendInvitationEmail(admin, emailRaw)
    if (res.ok) {
      await recordInvitationSent(admin, userId)
      inviteSent = true
    } else {
      inviteError = res.error
    }
  }

  return NextResponse.json({
    success: true,
    userId,
    email: emailRaw,
    invite_sent: inviteSent,
    invite_error: inviteError,
  })
}

export async function PATCH(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await request.json()
  const { userId, role, access_tier, email } = body as {
    userId?: string
    role?: string
    access_tier?: string
    email?: string
  }
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const updates: Record<string, string> = { updated_at: new Date().toISOString() }

  if (role !== undefined) {
    if (!VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    updates.role = role
  }
  if (access_tier !== undefined) {
    if (!VALID_TIERS.includes(access_tier as typeof VALID_TIERS[number])) {
      return NextResponse.json({ error: 'Invalid access_tier' }, { status: 400 })
    }
    updates.access_tier = access_tier
  }
  for (const field of PROFILE_TEXT_FIELDS) {
    const value = body[field]
    if (value !== undefined) {
      if (typeof value !== 'string') {
        return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 })
      }
      updates[field] = value
    }
  }

  const admin = createAdminClient()

  // Alten access_tier-Wert holen, damit wir bei premium→alumni/basic den
  // Downgrade-Flow (Abo kündigen + Mail) auslösen können.
  let oldTier: AccessTier | null = null
  if (access_tier !== undefined) {
    const { data: currentProfile } = await admin
      .from('profiles')
      .select('access_tier')
      .eq('id', userId)
      .single()
    oldTier = (currentProfile?.access_tier as AccessTier) ?? null
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  if (Object.keys(updates).length === 1) {
    if (email === undefined) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  }

  const { data, error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Post-Update-Hook: bei Community-Verlust Abo kündigen + Mail senden.
  // Läuft fire-and-forget — Fehler blockieren das UPDATE nicht, werden nur
  // geloggt. Admin kann notfalls manuell in Stripe nachfassen.
  if (
    oldTier &&
    access_tier !== undefined &&
    oldTier !== access_tier
  ) {
    try {
      const result = await handleAccessTierChange({
        userId,
        oldTier,
        newTier: access_tier as AccessTier,
      })
      if (result.subscriptionCancelled && result.periodEnd) {
        await notifyCommunityDowngrade({ userId, periodEnd: result.periodEnd })
      }
    } catch (err) {
      console.error('[admin/users] tier-change hook failed:', err)
    }

    // Community-Members-Sync: tier-Änderung in der Nutzerverwaltung muss
    // auf community_members durchschlagen, sonst zeigt /admin/community
    // einen veralteten Status. Fire-and-forget.
    try {
      await syncCommunityMemberFromTierChange(admin, userId, access_tier as AccessTier)
    } catch (err) {
      console.error('[admin/users] community-sync failed:', err)
    }
  }

  return NextResponse.json(data)
}

/**
 * Spiegelt eine tier-Änderung im Profil auf den verknüpften
 * community_members-Eintrag (falls vorhanden):
 *
 *   tier = 'premium' → skool_status = 'active' + Ablauf 1 Jahr in Zukunft
 *     (Admin schaltet User aktiv, also Mitgliedschaft "wieder voll gültig")
 *   tier = 'alumni'  → skool_status = 'alumni'
 *     (Mitgliedschaft beendet, aber User ehemaliges Mitglied)
 *   tier = 'basic'   → un-claim (profile_id=NULL, claimed_at=NULL)
 *     (User ist kein Community-Member mehr; Eintrag wird wieder einladbar
 *      wenn er ursprünglich von Stripe-Sync kam)
 *
 * Wenn kein community_members-Eintrag existiert, machen wir nichts —
 * der Admin müsste den dann manuell in /admin/community anlegen.
 */
async function syncCommunityMemberFromTierChange(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  newTier: AccessTier
): Promise<void> {
  const { data: member } = await admin
    .from('community_members')
    .select('id, skool_status')
    .eq('profile_id', userId)
    .maybeSingle()

  if (!member) return

  if (newTier === 'premium' && member.skool_status !== 'active') {
    const newExpiry = new Date()
    newExpiry.setFullYear(newExpiry.getFullYear() + 1)
    await admin
      .from('community_members')
      .update({
        skool_status: 'active',
        skool_access_expires_at: newExpiry.toISOString(),
      })
      .eq('id', member.id)
    return
  }

  if (newTier === 'alumni' && member.skool_status === 'active') {
    await admin
      .from('community_members')
      .update({ skool_status: 'alumni' })
      .eq('id', member.id)
    return
  }

  if (newTier === 'basic') {
    // Un-claim: User aus Community ausloggen, Eintrag bleibt wenn er von
    // Stripe-Sync kam (für Re-Invite). Token bleibt unangetastet.
    await admin
      .from('community_members')
      .update({ claimed_at: null, profile_id: null })
      .eq('id', member.id)
  }
}

export async function DELETE(request: Request) {
  const currentUser = await requireAdmin()
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (userId === currentUser.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  const admin = createAdminClient()

  // Pre-Delete-Sync: community_members un-claimen, damit der Admin den
  // Member im /admin/community-Tab wiedersieht und neu einladen kann.
  // ON DELETE SET NULL kümmert sich um profile_id, aber claimed_at muss
  // explizit zurückgesetzt werden — sonst zeigt die UI fälschlich
  // "geclaimed" obwohl der User weg ist.
  try {
    await admin
      .from('community_members')
      .update({ claimed_at: null })
      .eq('profile_id', userId)
  } catch (err) {
    console.error('[admin/users] community-unclaim before delete failed:', err)
  }

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
