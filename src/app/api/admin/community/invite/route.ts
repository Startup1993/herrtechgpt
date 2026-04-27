import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSkoolInviteEmail } from '@/lib/invitations'
import {
  generateInvitationToken,
  markInvitationSent,
} from '@/lib/skool-sync'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') return null
  return user
}

export async function POST(request: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = (await request.json().catch(() => null)) as { ids?: string[] } | null
  const ids = Array.isArray(body?.ids)
    ? body!.ids.filter((x): x is string => typeof x === 'string')
    : []
  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: members, error } = await admin
    .from('community_members')
    .select('id, email, name, skool_status, claimed_at')
    .in('id', ids)

  if (error || !members) {
    return NextResponse.json(
      { error: error?.message ?? 'Members nicht gefunden' },
      { status: 500 }
    )
  }

  // Credits-pro-Monat aus Plan S laden — wird in der Mail angezeigt.
  // Fällt auf 200 zurück falls Plan-Eintrag fehlt.
  const { data: planS } = await admin
    .from('plans')
    .select('credits_per_month')
    .eq('id', 'plan_s')
    .maybeSingle()
  const creditsPerMonth = planS?.credits_per_month ?? 200

  let invited = 0
  let failed = 0
  let skipped = 0
  const errors: Array<{ email: string; error: string }> = []

  for (const member of members) {
    try {
      if (member.claimed_at) {
        skipped += 1
        continue
      }
      // Refunded / cancelled werden nie eingeladen — die wollten raus
      if (member.skool_status === 'cancelled') {
        skipped += 1
        continue
      }

      const { token } = await generateInvitationToken(admin, member.id)
      const firstName = member.name?.split(' ')[0] ?? null
      const mode: 'active' | 'alumni' =
        member.skool_status === 'alumni' ? 'alumni' : 'active'
      const res = await sendSkoolInviteEmail(member.email, {
        token,
        firstName,
        creditsPerMonth,
        mode,
      })
      if (!res.ok) {
        failed += 1
        errors.push({ email: member.email, error: res.error })
        continue
      }
      await markInvitationSent(admin, member.id)
      invited += 1
    } catch (err) {
      failed += 1
      errors.push({
        email: member.email,
        error: err instanceof Error ? err.message : 'Unknown',
      })
    }
  }

  return NextResponse.json({ invited, failed, skipped, errors })
}
