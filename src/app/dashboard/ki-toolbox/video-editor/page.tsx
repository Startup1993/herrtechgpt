import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import {
  getActivePacks,
  getActivePlans,
  getMonetizationState,
} from '@/lib/monetization'
import { getFeatureState } from '@/lib/permissions'
import { getAppSettings } from '@/lib/app-settings'
import type { Plan, CreditPack } from '@/lib/types'
import type { SubscriptionGateState } from '@/components/subscription-gate'
import CommunityRequiredView from '@/components/community-required'
import VideoEditorView from './VideoEditorView'

export default async function VideoEditorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, plans, packs, cookieStore, settings] = await Promise.all([
    supabase.from('profiles').select('role, access_tier').eq('id', user.id).single(),
    getActivePlans(supabase),
    getActivePacks(supabase),
    cookies(),
    getAppSettings(),
  ])
  const access = computeEffectiveAccess(profile, cookieStore.get(VIEW_AS_COOKIE)?.value)

  // Permission-Gate: toolbox=community → User muss erst Community beitreten.
  const toolboxState = await getFeatureState(supabase, access.tier, 'toolbox')
  if (!access.isAdmin && toolboxState === 'community') {
    return (
      <CommunityRequiredView
        featureLabel="KI Video Editor"
        communityUrl={settings.communityUrl}
      />
    )
  }

  const monetization = await getMonetizationState(supabase, user.id, access.tier)

  // In NoSubs-Welt: premium + alumni dürfen die Tools nutzen (basic ist oben
  // schon durch CommunityRequiredView abgefangen).
  const noSubsAllowed =
    !settings.subscriptionsEnabled &&
    (access.tier === 'premium' || access.tier === 'alumni')

  const gateState: SubscriptionGateState = {
    hasActiveSubscription:
      access.isAdmin || monetization.hasActiveSubscription || noSubsAllowed,
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
