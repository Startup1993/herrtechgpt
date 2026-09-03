import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { listEnrollmentsAdmin } from '@/lib/coaching/queries'
import { computeProgress } from '@/lib/coaching/derive'
import { ENROLLMENT_STATUS_META, GOAL_STATUS_META } from '@/lib/coaching/types'

export const dynamic = 'force-dynamic'

const DAY = 24 * 60 * 60 * 1000

function avg(nums: number[]): number | null {
  if (!nums.length) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

/** Die Coaching-Database aus dem Konzept, nur echt: Zahlen über alle Teilnahmen. */
export default async function CoachingStatsPage() {
  const bundles = await listEnrollmentsAdmin()
  const active = bundles.filter((b) => b.enrollment.status === 'active')
  const completed = bundles.filter((b) => b.enrollment.status === 'completed')

  const allGoals = bundles.flatMap((b) => b.goals)
  const clientTasks = bundles.flatMap((b) => b.tasks.filter((t) => t.assignee === 'client' && t.status !== 'skipped'))
  const doneTasks = clientTasks.filter((t) => t.status === 'done')
  const overdue = clientTasks.filter((t) => t.status === 'open' && t.due_at && new Date(t.due_at).getTime() < Date.now()).length
  const timeToDone = doneTasks
    .filter((t) => t.completed_at && t.created_at)
    .map((t) => (new Date(t.completed_at!).getTime() - new Date(t.created_at).getTime()) / DAY)
  const moods = bundles.flatMap((b) => b.events.filter((e) => e.kind === 'mood' && e.mood_score != null).map((e) => e.mood_score as number))
  const nps = bundles.map((b) => b.enrollment.nps).filter((n): n is number => typeof n === 'number')
  const blockers = bundles.flatMap((b) => b.events.filter((e) => e.kind === 'client_blocker')).length
  const wins = bundles.flatMap((b) => b.events.filter((e) => e.kind === 'client_win')).length
  const logins = bundles.filter((b) => b.enrollment.last_client_seen_at).length
  const invited = bundles.filter((b) => b.enrollment.invited_at).length

  const byTrack = new Map<string, { n: number; moods: number[]; running: number; goals: number }>()
  for (const b of bundles) {
    const key = b.enrollment.track ?? 'offen'
    const cur = byTrack.get(key) ?? { n: 0, moods: [], running: 0, goals: 0 }
    cur.n++
    cur.moods.push(...b.events.filter((e) => e.kind === 'mood' && e.mood_score != null).map((e) => e.mood_score as number))
    cur.running += b.goals.filter((g) => g.status === 'running').length
    cur.goals += b.goals.length
    byTrack.set(key, cur)
  }

  const upsell = new Map<string, number>()
  for (const b of bundles) {
    const k = (b.enrollment.upsell_status ?? 'offen').trim() || 'offen'
    upsell.set(k, (upsell.get(k) ?? 0) + 1)
  }

  const tiles: Array<{ label: string; value: string; hint?: string }> = [
    { label: 'Teilnahmen', value: String(bundles.length), hint: `${active.length} aktiv · ${completed.length} abgeschlossen` },
    { label: 'Workflows laufen', value: `${allGoals.filter((g) => g.status === 'running').length} / ${allGoals.length}`, hint: `${allGoals.filter((g) => g.status === 'stuck').length} hängen` },
    { label: 'Aufgaben erledigt', value: clientTasks.length ? `${Math.round((doneTasks.length / clientTasks.length) * 100)} %` : '–', hint: `${doneTasks.length} von ${clientTasks.length} · ${overdue} überfällig` },
    { label: 'Tage bis erledigt', value: avg(timeToDone)?.toString() ?? '–', hint: 'Durchschnitt Kunden-Aufgaben' },
    { label: 'Stimmung', value: avg(moods)?.toString() ?? '–', hint: `${moods.length} Messungen, Skala 1 bis 5` },
    { label: 'NPS', value: avg(nps)?.toString() ?? '–', hint: `${nps.length} Antworten` },
    { label: 'Blocker / Erfolge', value: `${blockers} / ${wins}`, hint: 'vom Kunden gemeldet' },
    { label: 'Eingeladen / eingeloggt', value: `${invited} / ${logins}`, hint: 'World-Zugang' },
  ]

  return (
    <div className="p-6 sm:p-8 max-w-6xl">
      <Link href="/admin/coaching" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4"><ChevronLeft size={15} /> Cockpit</Link>
      <div className="mb-6">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary font-semibold mb-1">Coaching-Statistik</div>
        <h1 className="text-2xl font-bold text-foreground">Alle {bundles.length} Teilnahmen in Zahlen</h1>
        <p className="text-sm text-muted mt-1">Die Coaching-Database aus dem Konzept, gespeist aus dem, was im Cockpit passiert. Wird mit jeder Nachbereitung genauer.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {tiles.map((t) => (
          <div key={t.label} className="card-static p-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted">{t.label}</div>
            <div className="text-2xl font-extrabold tracking-tight text-foreground mt-1 tabular-nums">{t.value}</div>
            {t.hint && <div className="text-xs text-muted mt-0.5">{t.hint}</div>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card-static overflow-hidden">
          <div className="px-5 py-3 border-b border-border text-sm font-semibold text-foreground">Nach Track</div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] font-mono uppercase tracking-[0.1em] text-muted bg-surface-secondary"><th className="px-5 py-2 font-medium">Track</th><th className="px-3 py-2 font-medium">Kunden</th><th className="px-3 py-2 font-medium">Workflows laufen</th><th className="px-3 py-2 font-medium">Stimmung</th></tr></thead>
            <tbody>
              {[...byTrack.entries()].sort((a, b) => b[1].n - a[1].n).map(([track, v]) => (
                <tr key={track} className="border-t border-border">
                  <td className="px-5 py-2.5 font-semibold text-foreground">{track}</td>
                  <td className="px-3 py-2.5 tabular-nums">{v.n}</td>
                  <td className="px-3 py-2.5 tabular-nums">{v.running} / {v.goals}</td>
                  <td className="px-3 py-2.5 tabular-nums">{avg(v.moods) ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card-static overflow-hidden">
          <div className="px-5 py-3 border-b border-border text-sm font-semibold text-foreground">Upsell-Status</div>
          <table className="w-full text-sm">
            <tbody>
              {[...upsell.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => (
                <tr key={k} className="border-t border-border first:border-t-0"><td className="px-5 py-2.5 text-foreground">{k}</td><td className="px-3 py-2.5 tabular-nums text-right">{n}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="card-static overflow-hidden mt-6">
        <div className="px-5 py-3 border-b border-border text-sm font-semibold text-foreground">Pro Kunde</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead><tr className="text-left text-[11px] font-mono uppercase tracking-[0.1em] text-muted bg-surface-secondary"><th className="px-5 py-2 font-medium">Kunde</th><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2 font-medium">Track</th><th className="px-3 py-2 font-medium">Fortschritt</th><th className="px-3 py-2 font-medium">Workflows</th><th className="px-3 py-2 font-medium">Aufgaben</th><th className="px-3 py-2 font-medium">Stimmung Ø</th><th className="px-3 py-2 font-medium">NPS</th><th className="px-3 py-2 font-medium">Upsell</th></tr></thead>
            <tbody>
              {bundles.map((b) => {
                const p = computeProgress(b.milestones, b.tasks)
                const m = avg(b.events.filter((e) => e.kind === 'mood' && e.mood_score != null).map((e) => e.mood_score as number))
                const meta = ENROLLMENT_STATUS_META[b.enrollment.status]
                return (
                  <tr key={b.enrollment.id} className="border-t border-border">
                    <td className="px-5 py-2.5"><Link href={`/admin/coaching/${b.enrollment.id}`} className="font-semibold text-foreground hover:text-primary">{b.enrollment.client_name}</Link></td>
                    <td className="px-3 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[11px] font-mono ${meta.badge}`}>{meta.label}</span></td>
                    <td className="px-3 py-2.5">{b.enrollment.track ?? '–'}</td>
                    <td className="px-3 py-2.5 tabular-nums">{p.percent} %</td>
                    <td className="px-3 py-2.5"><span className="inline-flex gap-1">{b.goals.map((g) => <i key={g.id} className={`h-2 w-2 rounded-full ${GOAL_STATUS_META[g.status].dot}`} title={`${g.title}: ${GOAL_STATUS_META[g.status].label}`} />)}</span></td>
                    <td className="px-3 py-2.5 tabular-nums">{p.doneTasks} / {p.totalTasks}</td>
                    <td className="px-3 py-2.5 tabular-nums">{m ?? '–'}</td>
                    <td className="px-3 py-2.5 tabular-nums">{b.enrollment.nps ?? '–'}</td>
                    <td className="px-3 py-2.5 text-muted">{b.enrollment.upsell_status ?? '–'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
