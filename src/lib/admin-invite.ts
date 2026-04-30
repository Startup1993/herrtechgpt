/**
 * Zentraler Helper für Admin-Einladungen — wählt das richtige Mail-Template
 * je nach access_tier:
 *
 *   - tier='premium' → Skool-Active-Invite (Template 'skool_active')
 *                      Volle Community-Mitgliedschaft mit Claim-Token-Link.
 *   - tier='alumni'  → Skool-Alumni-Invite (Template 'skool_alumni')
 *                      Mit Classroom-Zugang-Hinweis + Claim-Token-Link.
 *   - tier='basic'   → Admin-Invite (Template 'admin_invite')
 *                      Magic-Link-Mail die der Admin im /admin/emails-Tab
 *                      pflegt (Subject, Headline, Intro, CTA, etc.).
 *                      Klick auf Link → Auto-Login + /dashboard.
 *
 * Alle drei Templates sind in /admin/emails editierbar.
 *
 * Wird genutzt von:
 *   - /api/admin/users POST           (Nutzer anlegen + erste Einladung)
 *   - /api/admin/users/send-invite    (Re-Invite für existierende User)
 *   - /api/admin/users/bulk           (Bulk-Invite mehrerer User)
 *
 * Idempotent: bei alumni/premium wird ein community_members-Eintrag
 * angelegt wenn nötig + Token für den Claim-Flow generiert.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  sendInvitationEmail,
  sendSkoolInviteEmail,
  recordInvitationSent,
} from './invitations'
import { generateInvitationToken } from './skool-sync'
import { getAppSettings } from './app-settings'

interface AdminInviteResult {
  ok: true
  type: 'admin_invite' | 'skool_active' | 'skool_alumni'
}
interface AdminInviteError {
  ok: false
  error: string
}
export type AdminInviteOutcome = AdminInviteResult | AdminInviteError

/**
 * Lädt das Profil + sendet die richtige Einladung. Aufrufer übergibt den
 * Admin-Client (service_role) — wir machen hier keinen Auth-Check, das
 * ist Sache der Route.
 */
export async function sendAdminInviteForUser(
  admin: SupabaseClient,
  userId: string
): Promise<AdminInviteOutcome> {
  // Auth-User für Email holen
  const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(userId)
  if (authErr || !authUser?.user?.email) {
    return { ok: false, error: authErr?.message ?? 'User not found' }
  }
  const email = authUser.user.email
  const fullName =
    (authUser.user.user_metadata?.full_name as string | undefined) ?? null
  const firstName = fullName?.split(' ')[0] ?? null

  // Profil für tier-Lookup
  const { data: profile } = await admin
    .from('profiles')
    .select('access_tier')
    .eq('id', userId)
    .maybeSingle()

  const tier = (profile?.access_tier as string | undefined) ?? 'basic'

  // ─── Branch je nach Tier ──────────────────────────────────────

  if (tier === 'alumni' || tier === 'premium') {
    // Skool-Invite. Wir brauchen einen community_members-Eintrag mit
    // invitation_token. Wenn keiner da ist, legen wir einen an.
    const memberId = await ensureCommunityMember(admin, userId, email, fullName, tier)
    if (!memberId) {
      return { ok: false, error: 'community_member konnte nicht angelegt werden' }
    }

    const { token } = await generateInvitationToken(admin, memberId)

    // Credits-Menge für Mail (kommt aus app_settings, fallback 200)
    const settings = await getAppSettings()

    const result = await sendSkoolInviteEmail(email, {
      token,
      firstName,
      creditsPerMonth: settings.communityMonthlyCredits,
      mode: tier === 'alumni' ? 'alumni' : 'active',
    })

    if (!result.ok) return { ok: false, error: result.error }

    // Invitation-Counter
    await recordInvitationSent(admin, userId)
    return {
      ok: true,
      type: tier === 'alumni' ? 'skool_alumni' : 'skool_active',
    }
  }

  // basic-User → Admin-Invite-Mail (Template 'admin_invite' aus /admin/emails).
  // sendInvitationEmail() nutzt intern dieses Template — der Inhalt ist
  // vollständig durch den Admin pflegbar (Subject, Hero, Benefits, CTA).
  const result = await sendInvitationEmail(admin, email, { firstName })
  if (!result.ok) return { ok: false, error: result.error }
  await recordInvitationSent(admin, userId)
  return { ok: true, type: 'admin_invite' }
}

/**
 * Stellt sicher, dass ein community_members-Eintrag für den User existiert.
 * Verknüpft mit profile_id. Setzt source='manual' wenn neu angelegt.
 * Returns die member.id oder null bei DB-Fehler.
 */
async function ensureCommunityMember(
  admin: SupabaseClient,
  userId: string,
  email: string,
  fullName: string | null,
  tier: 'alumni' | 'premium'
): Promise<string | null> {
  // Bestehenden Eintrag suchen (via profile_id ODER email)
  const { data: existing } = await admin
    .from('community_members')
    .select('id')
    .or(`profile_id.eq.${userId},email.eq.${email}`)
    .maybeSingle()

  if (existing) {
    // profile_id verknüpfen falls noch nicht (idempotent)
    await admin
      .from('community_members')
      .update({ profile_id: userId, email })
      .eq('id', existing.id)
    return existing.id as string
  }

  // Neu anlegen
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)

  const { data: created, error } = await admin
    .from('community_members')
    .insert({
      email,
      name: fullName,
      stripe_customer_id: null,
      skool_status: tier === 'alumni' ? 'alumni' : 'active',
      skool_access_started_at: new Date().toISOString(),
      skool_access_expires_at: expires.toISOString(),
      source: 'manual',
      profile_id: userId,
    })
    .select('id')
    .single()

  if (error || !created) {
    console.error('[admin-invite] community_member create failed:', error)
    return null
  }
  return created.id as string
}
