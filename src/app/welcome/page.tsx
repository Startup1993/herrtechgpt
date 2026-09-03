import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WelcomeScreen } from './WelcomeScreen'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Willkommen in der Herr Tech World',
}

export default async function WelcomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: enrollment }] = await Promise.all([
    supabase
      .from('profiles')
      .select('welcomed_at, access_tier')
      .eq('id', user.id)
      .single(),
    supabase
      .from('coaching_enrollments')
      .select('id')
      .eq('profile_id', user.id)
      .in('status', ['active', 'paused'])
      .limit(1)
      .maybeSingle(),
  ])

  // Coaching-Kunden sehen den Welcome-Screen nie, sie landen im Coaching.
  if (enrollment) {
    redirect('/dashboard/coaching')
  }

  // Wer schon durch den Welcome-Screen ist, skippt ihn beim Re-Visit.
  if (profile?.welcomed_at) {
    redirect('/dashboard')
  }

  const isCommunityMember = profile?.access_tier === 'premium'

  return <WelcomeScreen isCommunityMember={isCommunityMember} />
}
