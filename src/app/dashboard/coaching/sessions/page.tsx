import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthedUser } from '@/lib/server-cache'
import { getClientEnrollment } from '@/lib/coaching/queries'
import { sortMilestones } from '@/lib/coaching/derive'
import { SessionCard } from '../CoachingDashboard'

export const dynamic = 'force-dynamic'

export default async function CoachingSessionsPage() {
  const user = await getAuthedUser()
  if (!user) redirect('/login')
  const supabase = await createClient()
  const bundle = await getClientEnrollment(supabase, user.id)
  if (!bundle) redirect('/dashboard/coaching')

  const sessions = sortMilestones(bundle.milestones).filter((m) => m.status === 'done').reverse()

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto w-full px-5 sm:px-8 py-8 pb-24">
        <Link href="/dashboard/coaching" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-6">
          <ChevronLeft size={16} /> Zurück zu Mein Coaching
        </Link>
        <div className="mb-8">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary font-semibold mb-2">Alle Sessions</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Was wir bisher gemacht haben</h1>
          <p className="text-sm text-muted mt-2">Jede Session mit Zusammenfassung, Entscheidungen, Aufzeichnung und Recap. Neueste oben.</p>
        </div>
        {sessions.length === 0 ? (
          <div className="card-static p-8 text-center text-sm text-muted">Noch keine Session abgeschlossen. Nach dem Kickoff steht hier der erste Recap.</div>
        ) : (
          <div className="space-y-6">
            {sessions.map((m) => (
              <SessionCard key={m.id} milestone={m} materials={bundle.materials.filter((x) => x.milestone_id === m.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
