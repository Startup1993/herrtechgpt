import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import {
  getActivePlans,
  getMonetizationState,
  priceBandForAccessTier,
} from '@/lib/monetization'
import type { Plan } from '@/lib/types'
import PricingClient from './PricingClient'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/dashboard/pricing')

  const [{ data: profile }, plans, cookieStore] = await Promise.all([
    supabase.from('profiles').select('role, access_tier').eq('id', user.id).single(),
    getActivePlans(supabase),
    cookies(),
  ])
  const access = computeEffectiveAccess(profile, cookieStore.get(VIEW_AS_COOKIE)?.value)
  const priceBand = priceBandForAccessTier(access.tier)

  const state = await getMonetizationState(supabase, user.id, access.tier)

  return (
    <PricingClient
      plans={plans as Plan[]}
      defaultPriceBand={priceBand}
      isCommunity={access.tier === 'premium'}
      accessTier={access.tier}
      currentPlanId={state.subscription?.plan_id ?? null}
      currentCycle={state.subscription?.billing_cycle ?? null}
      subscriptionActive={state.hasActiveSubscription}
    />
  )
}
