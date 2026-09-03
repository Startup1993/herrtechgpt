import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import { getPermissionMatrix, getUpsellCopy } from '@/lib/permissions'
import { getActivePlans, getMonetizationState } from '@/lib/monetization'
import { getAppSettings } from '@/lib/app-settings'
import { getAuthedUser, getProfileCached } from '@/lib/server-cache'
import { getClientCoachingContext } from '@/lib/coaching/queries'
import type { Plan } from '@/lib/types'
import DashboardView from './DashboardView'

export default async function DashboardPage() {
  const user = await getAuthedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [profile, cookieStore, matrix, settings, coaching] = await Promise.all([
    getProfileCached(),
    cookies(),
    getPermissionMatrix(supabase),
    getAppSettings(),
    getClientCoachingContext(supabase, user.id),
  ])

  const viewAsRaw = cookieStore.get(VIEW_AS_COOKIE)?.value
  const access = computeEffectiveAccess(profile, viewAsRaw)

  // Programm-Zugang: Coaching-Kunden landen direkt in ihrem Coaching.
  if (coaching?.world_mode === 'program_only' && !access.isAdmin) redirect('/dashboard/coaching')

  const [upsell, plans, monetization] = await Promise.all([
    getUpsellCopy(supabase, access.tier),
    getActivePlans(supabase),
    getMonetizationState(supabase, user.id, access.tier),
  ])

  return (
    <DashboardView
      tier={access.tier}
      isAdmin={access.isAdmin}
      states={matrix[access.tier]}
      upsell={upsell}
      plans={plans as Plan[]}
      priceBand={monetization.priceBand}
      isCommunity={access.tier === 'premium'}
      hasActiveSubscription={monetization.hasActiveSubscription}
      currentPlanId={monetization.planId}
      currentPlanTier={monetization.planTier}
      currentCycle={monetization.subscription?.billing_cycle ?? null}
      subscriptionsEnabled={settings.subscriptionsEnabled}
      communityUrl={settings.communityUrl}
    />
  )
}
