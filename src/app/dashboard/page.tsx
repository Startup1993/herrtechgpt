import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import { getPermissionMatrix, getUpsellCopy } from '@/lib/permissions'
import { getActivePlans, getMonetizationState } from '@/lib/monetization'
import { getAuthedUser, getProfileCached } from '@/lib/server-cache'
import type { Plan } from '@/lib/types'
import DashboardView from './DashboardView'

export default async function DashboardPage() {
  const user = await getAuthedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [profile, cookieStore, matrix] = await Promise.all([
    getProfileCached(),
    cookies(),
    getPermissionMatrix(supabase),
  ])

  const viewAsRaw = cookieStore.get(VIEW_AS_COOKIE)?.value
  const access = computeEffectiveAccess(profile, viewAsRaw)

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
    />
  )
}
