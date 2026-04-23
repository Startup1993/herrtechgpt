import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { handleAccessTierChange } from '@/lib/monetization'
import { notifyCommunityDowngrade } from '@/lib/email'
import type { AccessTier } from '@/lib/access'

const VALID_ROLES = ['user', 'admin'] as const
const VALID_TIERS = ['basic', 'alumni', 'premium'] as const

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
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const currentUser = await requireAdmin()
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (userId === currentUser.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
