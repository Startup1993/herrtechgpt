import { listEnrollmentsAdmin, listPrograms } from '@/lib/coaching/queries'
import { derivePhase, deriveSignals, lastContact, latestMood, nextMilestone, computeProgress } from '@/lib/coaching/derive'
import { CoachingList, type ListRow, type TodayItem } from './CoachingList'

export const dynamic = 'force-dynamic'

export default async function AdminCoachingPage() {
  const [bundles, programs] = await Promise.all([listEnrollmentsAdmin(), listPrograms()])
  const now = new Date()

  const rows: ListRow[] = bundles.map((b) => {
    const next = nextMilestone(b.milestones)
    const openClient = b.tasks.filter((t) => t.assignee === 'client' && t.status === 'open')
    const overdue = openClient.filter((t) => t.due_at && new Date(t.due_at).getTime() < now.getTime()).length
    const contact = lastContact(b.events, b.enrollment)
    const mood = latestMood(b.events)
    return {
      id: b.enrollment.id,
      clientName: b.enrollment.client_name,
      company: b.enrollment.company,
      coach: b.enrollment.coach_name,
      status: b.enrollment.status,
      programTitle: b.program?.title ?? b.enrollment.program_key,
      phase: derivePhase(b.enrollment, b.milestones).short,
      nextAt: next?.scheduled_at ?? null,
      nextTitle: next?.title ?? null,
      openTasks: openClient.length,
      overdue,
      lastContact: contact,
      mood,
      signals: deriveSignals(b.enrollment, b.milestones, b.tasks, b.events, now),
      progress: computeProgress(b.milestones, b.tasks).percent,
      goals: b.goals.map((g) => g.status),
      hasProfile: !!b.enrollment.profile_id,
      invitedAt: b.enrollment.invited_at,
      nps: b.enrollment.nps,
    }
  })

  const horizon = now.getTime() + 2 * 24 * 60 * 60 * 1000
  const today: TodayItem[] = bundles
    .flatMap((b) =>
      b.tasks
        .filter((t) => t.assignee === 'coach' && t.status === 'open' && (!t.due_at || new Date(t.due_at).getTime() <= horizon))
        .map((t) => ({
          taskId: t.id,
          enrollmentId: b.enrollment.id,
          clientName: b.enrollment.client_name,
          title: t.title,
          dueAt: t.due_at,
          overdue: !!t.due_at && new Date(t.due_at).getTime() < now.getTime() - 60 * 60 * 1000,
        })),
    )
    .sort((a, b) => (a.dueAt ? new Date(a.dueAt).getTime() : 0) - (b.dueAt ? new Date(b.dueAt).getTime() : 0))

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary font-semibold mb-1">Coaching-Cockpit</div>
          <h1 className="text-2xl font-bold text-foreground">Alle Kunden auf einen Blick</h1>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            Aktive Teilnahmen oben mit Prozessposition und Signalen, abgeschlossene eingeklappt. Die Heute-Liste zeigt, was du wann schicken musst.
          </p>
        </div>
      </div>
      <CoachingList rows={rows} today={today} programs={programs.map((p) => ({ key: p.key, title: p.title }))} />
    </div>
  )
}
