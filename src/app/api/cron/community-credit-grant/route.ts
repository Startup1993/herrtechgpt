/**
 * Daily Cron: Monatlicher Credit-Grant für Community-Mitglieder
 *
 * Läuft 1× pro Tag. Findet community_members mit:
 *   skool_status = 'active'
 *   AND profile_id IS NOT NULL
 *   AND (last_credit_grant_at IS NULL
 *        OR last_credit_grant_at + interval '1 month' <= now())
 *
 * Für jeden: grantMonthlyCredits() mit dem Wert aus
 * app_settings.community_monthly_credits + last_credit_grant_at = now().
 *
 * Diese Route wird nur dann tatsächlich Credits gewähren, wenn das
 * Abo-System DEAKTIVIERT ist. Wenn es aktiv ist, kommen Credits via
 * Stripe-Invoice-Webhook und der Cron springt mit "skipped" raus.
 *
 * Auth: Vercel-Cron via Authorization-Header, manuell via ?secret=
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppSettings } from '@/lib/app-settings'
import { grantMonthlyCredits } from '@/lib/monetization'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface DueMember {
  id: string
  profile_id: string
  email: string | null
  last_credit_grant_at: string | null
}

export async function GET(req: NextRequest) {
  // ─── Auth (gleiche Logik wie skool-expiry) ─────────────────────
  const authHeader = req.headers.get('authorization')
  const secret = req.nextUrl.searchParams.get('secret')
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isManual = secret && secret === process.env.CRON_SECRET
  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ─── Master-Switch-Check ───────────────────────────────────────
  // Wenn Abos aktiv sind, machen wir hier nichts. Credits kommen dann via
  // Stripe-Invoice-Webhook bei Rebill. Cron läuft trotzdem täglich (kostet
  // nichts) — er springt nur sofort raus.
  const settings = await getAppSettings()
  if (settings.subscriptionsEnabled) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'subscriptions_enabled=true → Credits kommen via Stripe-Webhook',
    })
  }

  const admin = createAdminClient()
  const monthlyCredits = settings.communityMonthlyCredits

  // ─── Fällige Mitglieder finden ─────────────────────────────────
  // Postgres `+ interval '1 month'` = Kalendermonat (Jacob: "auch nicht
  // genau 30 tage"). Wenn Beitritt am 15. März, dann nächster Grant am
  // 15. April, 15. Mai usw.
  //
  // last_credit_grant_at IS NULL → noch nie erhalten → fällig.
  //
  // Wir bauen den Filter mit .or() weil Supabase-JS kein direktes
  // "WHERE last_credit_grant_at IS NULL OR ... <= now()" mit Interval kann.
  const nowMinusMonth = new Date()
  nowMinusMonth.setMonth(nowMinusMonth.getMonth() - 1)
  const cutoff = nowMinusMonth.toISOString()

  const { data: dueMembers, error } = await admin
    .from('community_members')
    .select('id, profile_id, email, last_credit_grant_at')
    .eq('skool_status', 'active')
    .not('profile_id', 'is', null)
    .or(`last_credit_grant_at.is.null,last_credit_grant_at.lte.${cutoff}`)
    .returns<DueMember[]>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!dueMembers || dueMembers.length === 0) {
    return NextResponse.json({
      ok: true,
      checked: 0,
      granted: 0,
      monthly_credits: monthlyCredits,
    })
  }

  // ─── Pro Mitglied: grantMonthlyCredits + Stempel updaten ───────
  let granted = 0
  const failures: { profileId: string; reason: string }[] = []
  const now = new Date()
  const resetAt = new Date()
  resetAt.setMonth(resetAt.getMonth() + 1)

  for (const member of dueMembers) {
    if (!member.profile_id) continue // Type-Guard

    const result = await grantMonthlyCredits({
      userId: member.profile_id,
      amount: monthlyCredits,
      resetAt,
      reason: 'monthly_reset',
    })

    if (!result.ok) {
      failures.push({ profileId: member.profile_id, reason: result.error })
      continue
    }

    const { error: stampError } = await admin
      .from('community_members')
      .update({ last_credit_grant_at: now.toISOString() })
      .eq('id', member.id)

    if (stampError) {
      // Credits wurden gewährt, aber Stempel nicht gesetzt → der nächste
      // Cron-Lauf würde nochmal gewähren. Wir loggen das, müssen aber nicht
      // rollback machen (lieber 1× zuviel Credits als verlorene).
      failures.push({
        profileId: member.profile_id,
        reason: `Stempel-Update fehlgeschlagen: ${stampError.message}`,
      })
    }

    granted++
  }

  return NextResponse.json({
    ok: true,
    checked: dueMembers.length,
    granted,
    monthly_credits: monthlyCredits,
    failures: failures.length > 0 ? failures : undefined,
  })
}
