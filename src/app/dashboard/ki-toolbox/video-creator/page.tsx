import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import VideoCreatorHome from './VideoCreatorHome'
import PremiumGate from './PremiumGate'

export default async function VideoCreatorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, access_tier')
    .eq('id', user.id)
    .maybeSingle()

  const cookieStore = await cookies()
  const viewAs = cookieStore.get(VIEW_AS_COOKIE)?.value
  const access = computeEffectiveAccess(profile, viewAs)

  const hasAccess = access.isAdmin || access.tier === 'premium'
  if (!hasAccess) return <PremiumGate currentTier={access.tier} />

  const configured = !!process.env.VIDEO_CREATOR_INTERNAL_URL
  return <VideoCreatorHome configured={configured} />
}
