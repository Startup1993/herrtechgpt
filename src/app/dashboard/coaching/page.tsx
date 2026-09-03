import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthedUser } from '@/lib/server-cache'
import { getClientEnrollment, touchClientSeen } from '@/lib/coaching/queries'
import { getAppSettings } from '@/lib/app-settings'
import { CoachingDashboard } from './CoachingDashboard'

export const dynamic = 'force-dynamic'

export default async function CoachingPage() {
  const user = await getAuthedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const [bundle, settings] = await Promise.all([getClientEnrollment(supabase, user.id), getAppSettings()])

  if (!bundle) {
    return (
      <div className="flex flex-col h-full overflow-y-auto bg-background">
        <div className="max-w-xl mx-auto w-full px-6 py-16 text-center">
          <div className="text-5xl mb-5">🎯</div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Noch kein Coaching hinterlegt</h1>
          <p className="text-sm text-muted mb-6">
            Sobald dein Coach dein Coaching angelegt hat, siehst du hier deinen Plan, deine Calls und deine Aufgaben.
          </p>
          <Link href="/dashboard" className="btn-primary">Zur Übersicht</Link>
        </div>
      </div>
    )
  }

  // Login-Signal für den Coach, nie blockierend.
  try {
    await touchClientSeen(createAdminClient(), bundle.enrollment)
  } catch (err) {
    console.error('[coaching] touchClientSeen fehlgeschlagen:', err)
  }

  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(' ')[0]
    ?? bundle.enrollment.client_name.split(' ')[0]

  return (
    <CoachingDashboard
      bundle={bundle}
      firstName={firstName}
      communityUrl={bundle.enrollment.community_url ?? settings.communityUrl}
    />
  )
}
