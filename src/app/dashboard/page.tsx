import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import { getPermissionMatrix, getUpsellCopy } from '@/lib/permissions'
import DashboardView from './DashboardView'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, cookieStore, matrix] = await Promise.all([
    supabase.from('profiles').select('role, access_tier').eq('id', user.id).single(),
    cookies(),
    getPermissionMatrix(supabase),
  ])

  const viewAsRaw = cookieStore.get(VIEW_AS_COOKIE)?.value
  const access = computeEffectiveAccess(profile, viewAsRaw)
  const upsell = await getUpsellCopy(supabase, access.tier)

  return (
    <DashboardView
      tier={access.tier}
      isAdmin={access.isAdmin}
      states={matrix[access.tier]}
      upsell={upsell}
    />
  )
}
