import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import PremiumGate from '../PremiumGate'
import NewProjectForm from './NewProjectForm'

export default async function NewProjectPage() {
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

  if (!access.isAdmin && access.tier !== 'premium') {
    return <PremiumGate currentTier={access.tier} />
  }

  return <NewProjectForm />
}
