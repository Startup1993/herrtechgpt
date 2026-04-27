import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import {
  getActivePacks,
  getActivePlans,
  getMonetizationState,
} from '@/lib/monetization'
import type { Plan, CreditPack } from '@/lib/types'
import type { SubscriptionGateState } from '@/components/subscription-gate'
import VideoCreatorGate from './VideoCreatorGate'
import SSORedirect from './SSORedirect'

export default async function VideoCreatorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, plans, packs, cookieStore] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, access_tier')
      .eq('id', user.id)
      .maybeSingle(),
    getActivePlans(supabase),
    getActivePacks(supabase),
    cookies(),
  ])

  const access = computeEffectiveAccess(profile, cookieStore.get(VIEW_AS_COOKIE)?.value)
  const monetization = await getMonetizationState(supabase, user.id, access.tier)

  // Admin oder aktives Abo → direkt zum Worker per SSO.
  // Kein Abo → Gate-Seite mit Pricing-Popup.
  const hasActiveSubscription = access.isAdmin || monetization.hasActiveSubscription

  if (hasActiveSubscription) {
    const workerUrl = process.env.VIDEO_CREATOR_PUBLIC_URL || 'https://vc.herr.tech'
    return <SSORedirect workerUrl={workerUrl} />
  }

  const gateState: SubscriptionGateState = {
    hasActiveSubscription: false,
    currentPlanId: monetization.planId,
    currentPlanTier: monetization.planTier,
    currentCycle: monetization.subscription?.billing_cycle ?? null,
    currentPeriodEnd: monetization.subscription?.current_period_end ?? null,
    scheduledPlanId: monetization.subscription?.scheduled_plan_id ?? null,
    scheduledCycle: monetization.subscription?.scheduled_billing_cycle ?? null,
    scheduledChangeAt: monetization.subscription?.scheduled_change_at ?? null,
    priceBand: monetization.priceBand,
    isCommunity: access.tier === 'premium',
    credits: monetization.totalCredits,
    plans: plans as Plan[],
    packs: packs as CreditPack[],
  }

  return <VideoCreatorGate gateState={gateState} />
}
