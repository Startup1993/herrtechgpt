import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import { getActivePacks, getMonetizationState, priceBandForAccessTier } from '@/lib/monetization'
import type { CreditPack } from '@/lib/types'
import CreditsClient from './CreditsClient'

export const dynamic = 'force-dynamic'

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const { checkout } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/dashboard/credits')

  const [{ data: profile }, packs, cookieStore] = await Promise.all([
    supabase.from('profiles').select('role, access_tier').eq('id', user.id).single(),
    getActivePacks(supabase),
    cookies(),
  ])
  const access = computeEffectiveAccess(profile, cookieStore.get(VIEW_AS_COOKIE)?.value)
  const state = await getMonetizationState(supabase, user.id, access.tier)
  const priceBand = priceBandForAccessTier(access.tier)

  return (
    <CreditsClient
      packs={packs as CreditPack[]}
      priceBand={priceBand}
      isCommunity={access.tier === 'premium'}
      currentBalance={state.totalCredits}
      hasSubscription={state.hasActiveSubscription}
      checkoutStatus={checkout ?? null}
    />
  )
}
