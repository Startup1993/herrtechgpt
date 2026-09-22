import { listAdminOverview, listPrograms } from '@/lib/coaching/queries'
import { derivePhase, deriveLane, nextMilestone, urgencyFromOverview, contactLabelFor } from '@/lib/coaching/derive'
import { getAppSettings } from '@/lib/app-settings'
import { CoachingHome, type HomeRow, type UpcomingItem, type FeedItem, type HomeTodo } from './CoachingHome'

export const dynamic = 'force-dynamic'

const DAY = 24 * 60 * 60 * 1000

export default async function AdminCoachingPage() {
  const [overview, programs, settings] = await Promise.all([listAdminOverview(), listPrograms(), getAppSettings()])
  const now = new Date()

  const rows: HomeRow[] = overview.map((r) => {
    const next = nextMilestone(r.milestones)
    const urgency = urgencyFromOverview(r, { now, clientAccess: settings.coachingClientAccess })
    const nextPrepOpen = !!next && r.coach_tasks.some((t) => t.milestone_id === next.id && t.kind === 'cadence' && /vorbereit/i.test(t.title))
    return {
      id: r.enrollment.id,
      clientName: r.enrollment.client_name,
      company: r.enrollment.company,
      coach: r.enrollment.coach_name,
      status: r.enrollment.status,
      phase: derivePhase(r.enrollment, r.milestones).short,
      lane: deriveLane(r.milestones),
      nextAt: next?.scheduled_at ?? null,
      nextTitle: next?.title ?? null,
      nextMeetingUrl: next?.meeting_url ?? null,
      nextPrepOpen,
      openClient: r.tasks.open_client,
      overdueClient: r.tasks.overdue_client,
      doneClient: r.tasks.done_client,
      coachDue: r.tasks.coach_due,
      coachExpired: r.tasks.coach_expired,
      blocker: r.blocker,
      mood: r.mood,
      lastContact: r.last_contact ? { label: contactLabelFor(r.last_contact.kind), at: r.last_contact.at } : null,
      goals: r.goals.map((g) => g.status),
      score: urgency.score,
      signals: urgency.signals,
      invitedAt: r.enrollment.invited_at,
      hasProfile: !!r.enrollment.profile_id,
      nps: r.enrollment.nps,
    }
  })

  const active = rows.filter((r) => r.status === 'active')

  const upcoming: UpcomingItem[] = overview
    .filter((r) => r.enrollment.status === 'active')
    .flatMap((r) => {
      const row = rows.find((x) => x.id === r.enrollment.id)!
      return r.milestones
        .filter((m) => m.scheduled_at && m.status !== 'done' && m.status !== 'cancelled')
        .filter((m) => {
          const t = new Date(m.scheduled_at as string).getTime()
          return t >= now.getTime() - 2 * 60 * 60 * 1000 && t <= now.getTime() + 7 * DAY
        })
        .map((m) => ({
          enrollmentId: r.enrollment.id,
          clientName: r.enrollment.client_name,
          coach: r.enrollment.coach_name,
          title: m.title,
          goal: m.goal,
          at: m.scheduled_at as string,
          meetingUrl: m.meeting_url,
          prepOpen: r.coach_tasks.some((t) => t.milestone_id === m.id && t.kind === 'cadence' && /vorbereit/i.test(t.title)),
          blocker: !!row.blocker,
        }))
    })
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  // Coach-To-dos der nächsten sieben Tage plus Überfälliges, quer über alle Kunden.
  const endOfTomorrow = new Date(now); endOfTomorrow.setHours(23, 59, 59, 999); endOfTomorrow.setDate(endOfTomorrow.getDate() + 7)
  const todos: HomeTodo[] = overview
    .filter((r) => r.enrollment.status === 'active')
    .flatMap((r) => r.coach_tasks
      .filter((t) => t.due_at && new Date(t.due_at).getTime() <= endOfTomorrow.getTime())
      .map((t) => ({
        taskId: t.id,
        enrollmentId: r.enrollment.id,
        clientName: r.enrollment.client_name,
        coach: r.enrollment.coach_name,
        title: t.title,
        dueAt: t.due_at as string,
        kind: t.kind,
        isPrep: /vorbereit/i.test(t.title),
        status: 'open' as const,
      })))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())

  const feed: FeedItem[] = overview
    .flatMap((r) => r.recent.map((ev) => ({ enrollmentId: r.enrollment.id, clientName: r.enrollment.client_name, coach: r.enrollment.coach_name, kind: ev.kind, body: ev.body, at: ev.at, source: ev.source, author: ev.author })))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 14)

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      <CoachingHome
        rows={rows}
        upcoming={upcoming}
        feed={feed}
        todos={todos}
        programs={programs.map((p) => ({ key: p.key, title: p.title }))}
        clientAccess={settings.coachingClientAccess}
        slackConfigured={!!process.env.SLACK_COACHING_WEBHOOK_URL}
        activeCount={active.length}
      />
    </div>
  )
}
