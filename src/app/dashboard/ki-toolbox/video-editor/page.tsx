import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import { getActivePacks, getActivePlans } from '@/lib/monetization'
import { getFeatureState } from '@/lib/permissions'
import { getAppSettings } from '@/lib/app-settings'
import { buildGateState } from '@/lib/gate-state'
import type { Plan, CreditPack } from '@/lib/types'
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

  const gateState = await buildGateState({
    supabase,
    userId: user.id,
    access,
    plans: plans as Plan[],
    packs: packs as CreditPack[],
  })

  return <VideoEditorView gateState={gateState} />
}
