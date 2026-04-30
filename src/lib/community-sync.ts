/**
 * Helper für Community-Member-Sync bei tier-Änderungen via Admin.
 *
 * Wird genutzt von /api/admin/users (PATCH) und /api/admin/users/bulk —
 * sodass Einzel- und Bulk-Operationen exakt dasselbe Verhalten haben.
 *
 * Verhalten je nach newTier:
 *   - 'premium': community_member auf 'active' + 1-Jahres-Ablauf, anlegen wenn fehlt.
 *     Initial-Credit-Grant wenn last_credit_grant_at IS NULL.
 *   - 'alumni':  skool_status='alumni' (User behält Eintrag, Credits werden nicht
 *     mehr automatisch erneuert dank Cron-Filter).
 *   - 'basic':   un-claim (profile_id=NULL, claimed_at=NULL) — Eintrag bleibt
 *     für Re-Invite, wenn er ursprünglich von Stripe-Sync kam.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { grantMonthlyCredits } from './monetization'
import { getAppSettings } from './app-settings'
import type { AccessTier } from './access'

export async function syncCommunityMemberFromTierChange(
  admin: SupabaseClient,
  userId: string,
  newTier: AccessTier
): Promise<void> {
  // Bestehenden community_members-Eintrag suchen (auch ohne profile_id-Verknüpfung
  // wäre möglich, aber wir setzen voraus, dass profile_id schon gesetzt ist —
  // sonst geht der User durch /admin/community).
  let { data: member } = await admin
    .from('community_members')
    .select('id, skool_status, last_credit_grant_at, email')
    .eq('profile_id', userId)
    .maybeSingle()

  if (newTier === 'premium') {
    const newExpiry = new Date()
    newExpiry.setFullYear(newExpiry.getFullYear() + 1)

    if (!member) {
      // Auto-Anlage: Admin hat User direkt auf Community gesetzt ohne
      // Skool-Kauf. Email holen wir aus auth.users.
      const { data: auth } = await admin.auth.admin.getUserById(userId)
      const email = auth?.user?.email ?? null
      const fullName =
        (auth?.user?.user_metadata?.full_name as string | undefined) ?? null

      const { data: created, error: createErr } = await admin
        .from('community_members')
        .insert({
          email: email ?? `unknown-${userId.slice(0, 8)}@local`,
          name: fullName,
          stripe_customer_id: null,
          skool_status: 'active',
          skool_access_started_at: new Date().toISOString(),
          skool_access_expires_at: newExpiry.toISOString(),
          source: 'manual',
          profile_id: userId,
          claimed_at: new Date().toISOString(),
        })
        .select('id, last_credit_grant_at, email')
        .single()

      if (createErr || !created) {
        console.error('[community-sync] member create failed:', createErr)
        return
      }
      member = { ...created, skool_status: 'active' }
    } else if (member.skool_status !== 'active') {
      await admin
        .from('community_members')
        .update({
          skool_status: 'active',
          skool_access_expires_at: newExpiry.toISOString(),
          claimed_at: new Date().toISOString(),
          profile_id: userId,
        })
        .eq('id', member.id)
    }

    // Initial-Credit-Grant: nur beim ersten Aktiv-Setzen.
    // Spätere Refreshes laufen monatlich via Cron community-credit-grant.
    if (member && !member.last_credit_grant_at) {
      try {
        const settings = await getAppSettings()
        const resetAt = new Date()
        resetAt.setMonth(resetAt.getMonth() + 1)
        const result = await grantMonthlyCredits({
          userId,
          amount: settings.communityMonthlyCredits,
          resetAt,
          reason: 'monthly_grant',
        })
        if (result.ok) {
          await admin
            .from('community_members')
            .update({ last_credit_grant_at: new Date().toISOString() })
            .eq('id', member.id)
        } else {
          console.error('[community-sync] initial credit grant failed:', result.error)
        }
      } catch (err) {
        console.error('[community-sync] initial credit grant exception:', err)
      }
    }
    return
  }

  if (newTier === 'alumni') {
    if (member && member.skool_status !== 'alumni') {
      await admin
        .from('community_members')
        .update({ skool_status: 'alumni' })
        .eq('id', member.id)
    }
    return
  }

  if (newTier === 'basic') {
    if (member) {
      await admin
        .from('community_members')
        .update({ claimed_at: null, profile_id: null })
        .eq('id', member.id)
    }
  }
}
