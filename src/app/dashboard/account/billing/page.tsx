import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import { getMonetizationState } from '@/lib/monetization'
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

  const [{ data: profile }, cookieStore] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, access_tier, stripe_customer_id')
      .eq('id', user.id)
      .single(),
    cookies(),
  ])
  const access = computeEffectiveAccess(profile, cookieStore.get(VIEW_AS_COOKIE)?.value)
  const state = await getMonetizationState(supabase, user.id, access.tier)

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

  return (
    <BillingClient
      subscription={state.subscription}
      wallet={state.wallet}
      planName={planName}
      planTier={state.planTier}
      transactions={transactions ?? []}
      checkoutStatus={checkout ?? null}
      hasStripeCustomer={!!profile?.stripe_customer_id || !!state.subscription}
    />
  )
}
