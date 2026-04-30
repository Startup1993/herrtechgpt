/**
 * POST /api/admin/users/bulk
 *
 * Bulk-Aktionen über mehrere User-IDs in einem Request:
 *   - { action: 'set_tier', userIds: string[], params: { access_tier: AccessTier } }
 *   - { action: 'delete',   userIds: string[] }
 *   - { action: 'invite',   userIds: string[] }  // sendet Magic-Link an noch
 *                                                 // nicht eingeloggte User
 *
 * Server iteriert intern und ruft die gleichen Hooks auf wie der Einzel-
 * PATCH/DELETE/Invite — sodass z.B. handleAccessTierChange + community-Sync
 * einheitlich greifen.
 *
 * Idempotent: Fehler bei einzelnen IDs werden gesammelt, der Request
 * antwortet mit { success_count, failed: [{ userId, error }] } statt
 * den ganzen Batch zu killen.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { handleAccessTierChange } from '@/lib/monetization'
import { notifyCommunityDowngrade } from '@/lib/email'
import { sendInvitationEmail, recordInvitationSent } from '@/lib/invitations'
import { syncCommunityMemberFromTierChange } from '@/lib/community-sync'
import type { AccessTier } from '@/lib/access'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const VALID_TIERS = ['basic', 'alumni', 'premium'] as const
const VALID_ACTIONS = ['set_tier', 'delete', 'invite'] as const

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

interface BulkBody {
  action?: string
  userIds?: unknown
  params?: { access_tier?: string }
}

export async function POST(request: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let body: BulkBody
  try {
    body = (await request.json()) as BulkBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = body.action
  if (!action || !VALID_ACTIONS.includes(action as (typeof VALID_ACTIONS)[number])) {
    return NextResponse.json(
      { error: `Invalid action. Allowed: ${VALID_ACTIONS.join(', ')}` },
      { status: 400 }
    )
  }

  if (!Array.isArray(body.userIds) || body.userIds.length === 0) {
    return NextResponse.json({ error: 'userIds (non-empty array) required' }, { status: 400 })
  }

  const userIds = (body.userIds as unknown[]).filter(
    (v): v is string => typeof v === 'string' && v.length > 0
  )

  if (userIds.length === 0) {
    return NextResponse.json({ error: 'No valid userIds provided' }, { status: 400 })
  }

  // Hard-Cap zur Sicherheit — Frontend sollte selber chunken bei mehr.
  if (userIds.length > 500) {
    return NextResponse.json(
      { error: 'Maximal 500 IDs pro Request. Frontend muss in Batches splitten.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const failed: Array<{ userId: string; error: string }> = []
  let successCount = 0

  if (action === 'set_tier') {
    const newTier = body.params?.access_tier
    if (!newTier || !VALID_TIERS.includes(newTier as AccessTier)) {
      return NextResponse.json(
        { error: `params.access_tier must be one of: ${VALID_TIERS.join(', ')}` },
        { status: 400 }
      )
    }
    const tier = newTier as AccessTier

    for (const userId of userIds) {
      try {
        // Alten tier holen für handleAccessTierChange-Hook
        const { data: old } = await admin
          .from('profiles')
          .select('access_tier')
          .eq('id', userId)
          .maybeSingle()
        const oldTier = (old?.access_tier as AccessTier) ?? null

        // Update profile
        const { error: updateError } = await admin
          .from('profiles')
          .update({ access_tier: tier, updated_at: new Date().toISOString() })
          .eq('id', userId)

        if (updateError) {
          failed.push({ userId, error: updateError.message })
          continue
        }

        // Hooks (fire-and-forget pro ID)
        if (oldTier && oldTier !== tier) {
          try {
            const result = await handleAccessTierChange({
              userId,
              oldTier,
              newTier: tier,
            })
            if (result.subscriptionCancelled && result.periodEnd) {
              await notifyCommunityDowngrade({ userId, periodEnd: result.periodEnd })
            }
          } catch (err) {
            console.error('[admin/users/bulk] tier-change hook failed for', userId, err)
          }

          // Community-Members-Sync — gleicher Helper wie Einzel-PATCH.
          // Legt Eintrag an wenn nötig + Initial-Credit-Grant bei premium.
          try {
            await syncCommunityMemberFromTierChange(admin, userId, tier)
          } catch (err) {
            console.error('[admin/users/bulk] community-sync failed for', userId, err)
          }
        }

        successCount += 1
      } catch (err) {
        failed.push({
          userId,
          error: err instanceof Error ? err.message : 'unbekannter Fehler',
        })
      }
    }
  } else if (action === 'delete') {
    for (const userId of userIds) {
      // Niemand darf sich selbst löschen
      if (userId === adminUser.id) {
        failed.push({ userId, error: 'Cannot delete yourself' })
        continue
      }
      try {
        // Pre-Delete: community-unclaim
        await admin
          .from('community_members')
          .update({ claimed_at: null })
          .eq('profile_id', userId)

        const { error } = await admin.auth.admin.deleteUser(userId)
        if (error) {
          failed.push({ userId, error: error.message })
          continue
        }
        successCount += 1
      } catch (err) {
        failed.push({
          userId,
          error: err instanceof Error ? err.message : 'unbekannter Fehler',
        })
      }
    }
  } else if (action === 'invite') {
    // Magic-Link-Einladung an noch nicht eingeloggte User. User die schon
    // mal eingeloggt waren überspringen wir (skipped, kein Fehler).
    for (const userId of userIds) {
      try {
        const { data: target, error: getErr } = await admin.auth.admin.getUserById(userId)
        if (getErr || !target?.user?.email) {
          failed.push({ userId, error: getErr?.message ?? 'User not found' })
          continue
        }
        if (target.user.last_sign_in_at) {
          // Schon eingeloggt — überspringen, ist kein Fehler
          continue
        }
        const result = await sendInvitationEmail(admin, target.user.email)
        if (!result.ok) {
          failed.push({ userId, error: result.error })
          continue
        }
        await recordInvitationSent(admin, userId)
        successCount += 1
      } catch (err) {
        failed.push({
          userId,
          error: err instanceof Error ? err.message : 'unbekannter Fehler',
        })
      }
    }
  }

  return NextResponse.json({
    success_count: successCount,
    failed,
  })
}
