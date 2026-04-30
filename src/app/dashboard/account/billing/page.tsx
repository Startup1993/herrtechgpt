import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import { getMonetizationState } from '@/lib/monetization'
import { getAppSettings } from '@/lib/app-settings'
import BillingClient from './BillingClient'

export const dynamic = 'force-dynamic'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const { checkout } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/dashboard/account/billing')

  const [{ data: profile }, cookieStore, settings] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, access_tier, stripe_customer_id')
      .eq('id', user.id)
      .single(),
    cookies(),
    getAppSettings(),
  ])
  const access = computeEffectiveAccess(profile, cookieStore.get(VIEW_AS_COOKIE)?.value)
  const state = await getMonetizationState(supabase, user.id, access.tier)

  // Community-Mitgliedschafts-Daten für premium-Tier laden:
  // - skool_access_expires_at: bis wann die Mitgliedschaft gültig ist
  // - last_credit_grant_at: wann der nächste monatliche Refresh ist
  // Wir nutzen den admin-client weil community_members RLS-protected ist
  // (admin + service_role only), und der User soll seine eigenen Daten sehen.
  let communityExpiresAt: string | null = null
  let nextCreditGrantAt: string | null = null
  if (access.tier === 'premium') {
    const admin = createAdminClient()
    const { data: member } = await admin
      .from('community_members')
      .select('skool_access_expires_at, last_credit_grant_at')
      .eq('profile_id', user.id)
      .maybeSingle()
    communityExpiresAt = member?.skool_access_expires_at ?? null
    if (member?.last_credit_grant_at) {
      // Nächster Grant = letzter + 1 Kalendermonat (matched Cron-Logik).
      const last = new Date(member.last_credit_grant_at)
      const next = new Date(last)
      next.setMonth(next.getMonth() + 1)
      nextCreditGrantAt = next.toISOString()
    }
  }

  // Plan-Details für Anzeige
  let planName: string | null = null
  if (state.subscription?.plan_id) {
    const { data: plan } = await supabase
      .from('plans')
      .select('name, tier')
      .eq('id', state.subscription.plan_id)
      .maybeSingle()
    planName = plan?.name ?? null
  }

  // Letzte Credit-Transaktionen (max 10)
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('id, amount, reason, feature, created_at, note')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Geplanter Plan-Wechsel (Downgrade zum Periodenende)
  let scheduledPlanName: string | null = null
  let scheduledChangeAt: string | null = null
  let scheduledCycle: 'monthly' | 'yearly' | null = null
  if (state.subscription?.id) {
    const { data: sched } = await supabase
      .from('subscriptions')
      .select('scheduled_plan_id, scheduled_billing_cycle, scheduled_change_at')
      .eq('id', state.subscription.id)
      .maybeSingle()
    if (sched?.scheduled_plan_id && sched.scheduled_change_at) {
      const { data: schedPlan } = await supabase
        .from('plans')
        .select('name')
        .eq('id', sched.scheduled_plan_id)
        .maybeSingle()
      scheduledPlanName = schedPlan?.name ?? sched.scheduled_plan_id
      scheduledChangeAt = sched.scheduled_change_at
      scheduledCycle = (sched.scheduled_billing_cycle as 'monthly' | 'yearly' | null) ?? null
    }
  }

  return (
    <BillingClient
      subscription={state.subscription}
      wallet={state.wallet}
      planName={planName}
      planTier={state.planTier}
      transactions={transactions ?? []}
      checkoutStatus={checkout ?? null}
      hasStripeCustomer={!!profile?.stripe_customer_id || !!state.subscription}
      scheduledPlanName={scheduledPlanName}
      scheduledChangeAt={scheduledChangeAt}
      scheduledCycle={scheduledCycle}
      subscriptionsEnabled={settings.subscriptionsEnabled}
      communityUrl={settings.communityUrl}
      tier={access.tier}
      communityExpiresAt={communityExpiresAt}
      nextCreditGrantAt={nextCreditGrantAt}
    />
  )
}
