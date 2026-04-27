import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import {
  getActivePacks,
  getActivePlans,
  getMonetizationState,
} from '@/lib/monetization'
import type { Plan, CreditPack } from '@/lib/types'
import type { SubscriptionGateState } from '@/components/subscription-gate'
import VideoEditorView from './VideoEditorView'

export default async function VideoEditorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, plans, packs, cookieStore] = await Promise.all([
    supabase.from('profiles').select('role, access_tier').eq('id', user.id).single(),
    getActivePlans(supabase),
    getActivePacks(supabase),
    cookies(),
  ])
  const access = computeEffectiveAccess(profile, cookieStore.get(VIEW_AS_COOKIE)?.value)
  const monetization = await getMonetizationState(supabase, user.id, access.tier)

  const gateState: SubscriptionGateState = {
    hasActiveSubscription: access.isAdmin || monetization.hasActiveSubscription,
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

  return <VideoEditorView gateState={gateState} />
}
