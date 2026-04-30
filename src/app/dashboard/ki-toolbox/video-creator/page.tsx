import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
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
import VideoCreatorGate from './VideoCreatorGate'
import SSORedirect from './SSORedirect'

export default async function VideoCreatorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, plans, packs, cookieStore, settings] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, access_tier')
      .eq('id', user.id)
      .maybeSingle(),
    getActivePlans(supabase),
    getActivePacks(supabase),
    cookies(),
    getAppSettings(),
  ])

  const access = computeEffectiveAccess(profile, cookieStore.get(VIEW_AS_COOKIE)?.value)

  // Permission-Gate: toolbox=community → User muss erst Community beitreten.
  // Greift in NoSubs-Welt für basic-User (Default) und überall wo Admin
  // im "Gruppen & Rechte"-Tab toolbox=community gesetzt hat.
  const toolboxState = await getFeatureState(supabase, access.tier, 'toolbox')
  if (!access.isAdmin && toolboxState === 'community') {
    return (
      <CommunityRequiredView
        featureLabel="KI Video Creator"
        communityUrl={settings.communityUrl}
        benefits={[
          'KI-generierte Szenen aus Text oder URL',
          'Bild- & Voiceover-Generation automatisch',
          'Export als MP4, Slide-Deck und mehr',
          'Inklusive monatliche Credits für die Toolbox',
        ]}
      />
    )
  }

  const monetization = await getMonetizationState(supabase, user.id, access.tier)

  // Gate-Logik abhängig vom Master-Switch:
  //
  // subscriptionsEnabled=true (Legacy): Admin oder aktives Abo → SSO-Redirect.
  //   Kein Abo → Gate-Seite mit Pricing-Popup ("Plan wählen").
  //
  // subscriptionsEnabled=false (Community-only): wenn toolbox=open
  //   (premium oder alumni mit Credits) → SSO-Redirect. basic ist oben
  //   schon abgefangen mit CommunityRequiredView.
  const skipGate =
    !settings.subscriptionsEnabled ||
    access.isAdmin ||
    monetization.hasActiveSubscription

  if (skipGate) {
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
