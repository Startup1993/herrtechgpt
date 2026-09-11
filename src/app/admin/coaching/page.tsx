import { listEnrollmentsAdmin, listPrograms } from '@/lib/coaching/queries'
import { derivePhase, deriveSignals, lastContact, latestMood, nextMilestone, computeProgress, isStaleCadence } from '@/lib/coaching/derive'
import { getAppSettings } from '@/lib/app-settings'
import { EVENT_KIND_META } from '@/lib/coaching/types'
import { CoachingList, type ListRow, type TodoGroup, type UpcomingItem, type AttentionItem, type RecentItem } from './CoachingList'

export const dynamic = 'force-dynamic'

const DAY = 24 * 60 * 60 * 1000

export default async function AdminCoachingPage() {
  const [bundles, programs, settings] = await Promise.all([listEnrollmentsAdmin(), listPrograms(), getAppSettings()])
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
      moodTrend: b.events.filter((e) => e.kind === 'mood' && e.mood_score != null).slice(0, 8).reverse().map((e) => e.mood_score as number),
      signals: deriveSignals(b.enrollment, b.milestones, b.tasks, b.events, now),
      progress: computeProgress(b.milestones, b.tasks).percent,
      goals: b.goals.map((g) => g.status),
      hasProfile: !!b.enrollment.profile_id,
      invitedAt: b.enrollment.invited_at,
      nps: b.enrollment.nps,
    }
  })

  // Heute: Coach-Aufgaben, die heute oder früher fällig sind. Erinnerungen zu gelaufenen Sessions fallen raus.
  const todos: TodoGroup[] = bundles
    .map((b) => {
      const items = b.tasks
        .filter((t) => t.assignee === 'coach' && t.status === 'open')
        .filter((t) => !isStaleCadence(t, b.milestones, now))
        .filter((t) => !t.due_at || new Date(t.due_at).getTime() <= now.getTime() + DAY)
        .sort((a, c) => (a.due_at ? new Date(a.due_at).getTime() : Infinity) - (c.due_at ? new Date(c.due_at).getTime() : Infinity))
        .map((t) => ({
          taskId: t.id,
          title: t.title,
          dueAt: t.due_at,
          kind: t.kind,
          overdue: !!t.due_at && new Date(t.due_at).getTime() < now.getTime() - 60 * 60 * 1000,
        }))
      return { enrollmentId: b.enrollment.id, clientName: b.enrollment.client_name, items }
    })
    .filter((g) => g.items.length > 0)
    .sort((a, b) => firstDue(a) - firstDue(b))

  // Nächste Termine in den kommenden 7 Tagen.
  const upcoming: UpcomingItem[] = bundles
    .flatMap((b) =>
      b.milestones
        .filter((m) => m.scheduled_at && m.status !== 'done' && m.status !== 'cancelled')
        .filter((m) => {
          const t = new Date(m.scheduled_at as string).getTime()
          return t >= now.getTime() - 2 * 60 * 60 * 1000 && t <= now.getTime() + 7 * DAY
        })
        .map((m) => ({ enrollmentId: b.enrollment.id, clientName: b.enrollment.client_name, title: m.title, at: m.scheduled_at as string, meetingUrl: m.meeting_url })),
    )
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  // Braucht dich: aktive Kunden mit rotem Signal.
  const attention: AttentionItem[] = rows
    .filter((r) => r.status === 'active' && r.signals.some((s) => s.level === 'bad'))
    .map((r) => ({ enrollmentId: r.id, clientName: r.clientName, labels: r.signals.filter((s) => s.level === 'bad').map((s) => s.label) }))

  // Neu seit gestern: was Plugin, Coach oder Kunde in den letzten 48 Stunden geändert haben.
  const since = now.getTime() - 2 * DAY
  const recent: RecentItem[] = bundles
    .map((b) => {
      const fresh = b.events.filter((e) => e.kind !== 'mood' && e.kind !== 'login' && new Date(e.created_at).getTime() >= since)
      const created = new Date(b.enrollment.created_at).getTime() >= since
      const counts = new Map<string, number>()
      if (created) counts.set('Teilnahme neu angelegt', 1)
      for (const e of fresh) {
        const label = EVENT_KIND_META[e.kind]?.label ?? e.kind
        counts.set(label, (counts.get(label) ?? 0) + 1)
      }
      const newTasks = b.tasks.filter((t) => new Date(t.created_at).getTime() >= since).length
      if (newTasks) counts.set('Aufgaben', newTasks)
      const labels = [...counts.entries()].map(([label, n]) => (n > 1 && label !== 'Teilnahme neu angelegt' ? `${n} × ${label}` : label))
      const latest = Math.max(created ? new Date(b.enrollment.created_at).getTime() : 0, ...fresh.map((e) => new Date(e.created_at).getTime()))
      return { enrollmentId: b.enrollment.id, clientName: b.enrollment.client_name, labels, at: latest > 0 ? new Date(latest).toISOString() : null }
    })
    .filter((r) => r.labels.length > 0)
    .sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime())

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      <div className="mb-5">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary font-semibold mb-1">Coaching-Cockpit</div>
        <h1 className="text-2xl font-bold text-foreground">Alle Kunden auf einen Blick</h1>
      </div>
      <CoachingList
        rows={rows}
        todos={todos}
        upcoming={upcoming}
        attention={attention}
        recent={recent}
        programs={programs.map((p) => ({ key: p.key, title: p.title }))}
        clientAccess={settings.coachingClientAccess}
        slackConfigured={!!process.env.SLACK_COACHING_WEBHOOK_URL}
      />
    </div>
  )
}

function firstDue(g: TodoGroup): number {
  const t = g.items[0]?.dueAt
  return t ? new Date(t).getTime() : Infinity
}
