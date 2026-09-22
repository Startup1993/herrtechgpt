'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart3, ChevronDown, ChevronRight, ClipboardList, Loader2, Plus, Undo2, Video } from 'lucide-react'
import type { EnrollmentStatus, EventKind, EventSource, GoalStatus } from '@/lib/coaching/types'
import { COACH_OPTIONS, GOAL_STATUS_META } from '@/lib/coaching/types'
import type { Lane, Signal } from '@/lib/coaching/derive'
import { LANE_META, relativeDays } from '@/lib/coaching/derive'
import { Avatar, MoodDots } from '@/components/coaching/visual'
import { TaskCheck } from '@/components/coaching/TaskCheck'
import { useOptimisticTasks } from '@/components/coaching/useOptimisticTasks'
import { NewEnrollmentModal } from './NewEnrollmentModal'

export interface HomeRow {
  id: string
  clientName: string
  company: string | null
  coach: string | null
  status: EnrollmentStatus
  phase: string
  lane: Lane
  nextAt: string | null
  nextTitle: string | null
  nextMeetingUrl: string | null
  nextPrepOpen: boolean
  openClient: number
  overdueClient: number
  doneClient: number
  coachDue: number
  coachExpired: number
  blocker: { body: string | null; at: string } | null
  mood: { score: number; body: string | null; at: string; trend: number[] } | null
  lastContact: { label: string; at: string } | null
  goals: GoalStatus[]
  score: number
  signals: Signal[]
  invitedAt: string | null
  hasProfile: boolean
  nps: number | null
}

export interface UpcomingItem {
  enrollmentId: string
  clientName: string
  coach: string | null
  title: string
  goal: string | null
  at: string
  meetingUrl: string | null
  prepOpen: boolean
  blocker: boolean
}

export interface HomeTodo {
  taskId: string
  enrollmentId: string
  clientName: string
  coach: string | null
  title: string
  dueAt: string
  kind: string
  isPrep: boolean
  status: 'open' | 'done' | 'skipped'
}

export interface FeedItem {
  enrollmentId: string
  clientName: string
  coach: string | null
  kind: EventKind
  body: string | null
  at: string
  source: EventSource
  author: string | null
}

const LABEL = 'text-[11px] font-mono uppercase tracking-[0.12em] text-primary font-semibold'
const LANES: Lane[] = ['vor_kickoff', 'w1', 'w2', 'w3', 'w4', 'nachlauf']
const LANE_COLOR: Record<Lane, string> = { vor_kickoff: 'bg-muted-light', w1: 'bg-primary/40', w2: 'bg-primary/60', w3: 'bg-primary/80', w4: 'bg-primary', nachlauf: 'bg-success' }
const FILTER_KEY = 'coaching.coachFilter'
const DAY = 24 * 60 * 60 * 1000

type CoachFilter = 'Alle' | (typeof COACH_OPTIONS)[number]

const FILTER_EVENT = 'coaching-filter'
function readFilter(): CoachFilter {
  try {
    const saved = window.localStorage.getItem(FILTER_KEY)
    if (saved === 'Alle' || (COACH_OPTIONS as readonly string[]).includes(saved ?? '')) return saved as CoachFilter
  } catch { /* kein Speicher */ }
  return 'Alle'
}
function subscribeFilter(cb: () => void) {
  window.addEventListener(FILTER_EVENT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(FILTER_EVENT, cb); window.removeEventListener('storage', cb) }
}
function writeFilter(f: CoachFilter) {
  try { window.localStorage.setItem(FILTER_KEY, f) } catch { /* egal */ }
  window.dispatchEvent(new Event(FILTER_EVENT))
}

export function CoachingHome({ rows, upcoming, feed, todos, programs, clientAccess, slackConfigured }: {
  rows: HomeRow[]
  upcoming: UpcomingItem[]
  feed: FeedItem[]
  todos: HomeTodo[]
  programs: Array<{ key: string; title: string }>
  clientAccess: boolean
  slackConfigured: boolean
  activeCount: number
}) {
  const router = useRouter()
  const filter = useSyncExternalStore(subscribeFilter, readFilter, () => 'Alle' as CoachFilter)
  const [creating, setCreating] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [access, setAccess] = useState(clientAccess)
  const [togglingAccess, setTogglingAccess] = useState(false)
  const [today] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })

  async function toggleAccess() {
    const next = !access
    const msg = next
      ? 'Kunden-Zugang anschalten? Danach sehen eingeladene Kunden ihr Dashboard, und Einladungen sowie Antwort-Mails gehen raus.'
      : 'Kunden-Zugang ausschalten? Kunden sehen dann nur „Dein Bereich kommt gleich“, keine Kunden-Mails.'
    if (!confirm(msg)) return
    setTogglingAccess(true)
    const res = await fetch('/api/admin/coaching/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coachingClientAccess: next }) })
    if (res.ok) setAccess(next)
    setTogglingAccess(false)
    router.refresh()
  }

  const byCoach = <T extends { coach: string | null }>(list: T[]) => (filter === 'Alle' ? list : list.filter((x) => x.coach === filter))
  const visible = byCoach(rows)
  const active = visible.filter((r) => r.status === 'active').sort((a, b) => b.score - a.score || nextTime(a) - nextTime(b))
  const completed = visible.filter((r) => r.status === 'completed')
  const paused = visible.filter((r) => r.status === 'paused')
  const attention = active.filter((r) => r.signals.some((s) => s.level === 'bad'))
  const calls = byCoach(upcoming)
  const events = byCoach(feed)
  const myTodos = byCoach(todos)
  const laneCounts = LANES.map((l) => ({ lane: l, n: active.filter((r) => r.lane === l).length }))
  const days = Array.from({ length: 7 }, (_, i) => new Date(today.getTime() + i * DAY))
  const callsByDay = days.map((d) => calls.filter((c) => sameDay(new Date(c.at), d)))

  return (
    <div className="space-y-6">
      {/* Kopf */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className={LABEL}>Coaching-Cockpit</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mt-1">
            {today.toLocaleDateString('de-DE', { weekday: 'long' })}<span className="text-muted font-semibold">, {today.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })}</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 rounded-lg border border-border bg-surface p-0.5">
            {(['Alle', ...COACH_OPTIONS] as CoachFilter[]).map((f) => (
              <button key={f} type="button" onClick={() => writeFilter(f)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? 'bg-primary/15 text-primary' : 'text-muted hover:text-foreground'}`}>{f}</button>
            ))}
          </div>
          <Link href="/admin/coaching/stats" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover"><BarChart3 size={14} /> Statistik</Link>
          <button type="button" onClick={() => setCreating(true)} className="btn-primary !py-1.5 !px-3 !text-xs"><Plus size={14} /> Kunde</button>
        </div>
      </div>

      {/* Kennzahlen */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-static p-4 grid gap-2">
          <div className="flex items-baseline justify-between"><span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted">Aktiv</span><span className="text-3xl font-extrabold tabular-nums text-foreground leading-none">{active.length}</span></div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-border gap-px">
            {laneCounts.filter((x) => x.n > 0).map((x) => <span key={x.lane} className={`${LANE_COLOR[x.lane]} h-full`} style={{ width: `${(x.n / Math.max(active.length, 1)) * 100}%` }} title={`${LANE_META[x.lane]}: ${x.n}`} />)}
          </div>
          <div className="flex flex-wrap gap-x-2 text-[10.5px] font-mono text-muted">
            {laneCounts.filter((x) => x.n > 0).map((x) => <span key={x.lane} className="inline-flex items-center gap-1"><i className={`h-1.5 w-1.5 rounded-full ${LANE_COLOR[x.lane]}`} />{x.n} {LANE_META[x.lane]}</span>)}
            {active.length === 0 && <span>keine aktiven Kunden</span>}
          </div>
        </div>

        <div className="card-static p-4 grid gap-2">
          <div className="flex items-baseline justify-between"><span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted">Calls · 7 Tage</span><span className="text-3xl font-extrabold tabular-nums text-foreground leading-none">{calls.length}</span></div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => <span key={i} className={`h-2 rounded-full ${callsByDay[i].length ? 'bg-primary' : 'bg-border'}`} title={`${d.toLocaleDateString('de-DE', { weekday: 'short' })}: ${callsByDay[i].length}`} />)}
          </div>
          <div className="text-[10.5px] font-mono text-muted truncate">{calls[0] ? `nächster ${relativeDays(calls[0].at)} · ${calls[0].clientName.split(' ')[0]} · ${calls[0].title}` : 'keiner terminiert'}</div>
        </div>

        <div className={`card-static p-4 grid gap-2 ${attention.length ? 'border-danger/40' : ''}`}>
          <div className="flex items-baseline justify-between"><span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted">Braucht dich</span><span className={`text-3xl font-extrabold tabular-nums leading-none ${attention.length ? 'text-danger' : 'text-success'}`}>{attention.length}</span></div>
          <div className="flex items-center -space-x-1.5 h-6">
            {attention.slice(0, 6).map((r) => <Avatar key={r.id} name={r.clientName} size={24} ring="bad" />)}
            {attention.length === 0 && <span className="text-xs text-muted">alles ruhig</span>}
          </div>
          <div className="text-[10.5px] font-mono text-muted truncate">{attention.length ? summarizeAttention(attention) : 'kein Blocker, kein fehlender Termin'}</div>
        </div>

        <button type="button" onClick={toggleAccess} disabled={togglingAccess} className="card-static p-4 text-left grid gap-2 hover:border-primary/40 transition-colors" title="Klick schaltet um">
          <div className="flex items-baseline justify-between"><span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted">Kunden-Zugang</span><span className={`text-xl font-extrabold leading-none flex items-center gap-2 ${access ? 'text-success' : 'text-warning'}`}>{togglingAccess ? <Loader2 size={16} className="animate-spin" /> : null}{access ? 'an' : 'aus'}</span></div>
          <div className={`h-2 rounded-full ${access ? 'bg-success' : 'bg-warning/60'}`} />
          <div className="text-[10.5px] font-mono text-muted truncate">{rows.filter((r) => r.invitedAt).length} eingeladen · Slack {slackConfigured ? 'verbunden' : 'fehlt'}</div>
        </button>
      </div>

      {/* Deine Woche: Calls und To-dos pro Arbeitstag */}
      <WeekAgenda calls={calls} todos={myTodos} showCoach={filter === 'Alle'} />

      {/* Braucht dich · Passiert */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-static p-4 space-y-2.5">
          <div className="flex items-baseline justify-between"><span className={LABEL}>Braucht dich</span><span className="text-[11px] font-mono text-muted">{attention.length} Kunde{attention.length === 1 ? '' : 'n'}</span></div>
          {attention.length === 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 px-3 py-3 text-sm text-foreground"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Alles ruhig. Kein Blocker, kein fehlender Termin.</div>
          )}
          {attention.map((r) => (
            <div key={r.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2.5">
              <Avatar name={r.clientName} size={36} ring="bad" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0"><Link href={`/admin/coaching/${r.id}`} className="text-sm font-bold text-foreground hover:text-primary truncate">{r.clientName}</Link><span className="text-[10.5px] font-mono text-muted">{r.phase}</span></div>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {r.signals.filter((s) => s.level === 'bad').map((s, i) => <span key={i} className="rounded-full bg-danger/15 px-2 py-0.5 text-[10.5px] font-mono text-danger">{s.label}</span>)}
                </div>
                {r.blocker?.body && <p className="mt-1 text-xs text-muted line-clamp-2" title={r.blocker.body}>„{r.blocker.body}“</p>}
              </div>
              <Link href={`/admin/coaching/${r.id}?tab=${r.blocker ? 'history' : 'sessions'}`} className="rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-primary-hover whitespace-nowrap">{r.blocker ? 'Antworten' : 'Termin'}</Link>
            </div>
          ))}
        </section>

        <section className="card-static p-4 space-y-2.5">
          <div className="flex items-baseline justify-between"><span className={LABEL}>Passiert</span><span className="text-[11px] font-mono text-muted">48 h</span></div>
          {events.length === 0 && <p className="text-sm text-muted py-2">Nichts Neues in den letzten zwei Tagen.</p>}
          <div className="space-y-1.5">
            {groupFeed(events).slice(0, 8).map((f, i) => (
              <Link key={i} href={`/admin/coaching/${f.enrollmentId}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-surface-hover">
                <Avatar name={f.clientName} size={26} />
                <div className="min-w-0 text-[13px] leading-snug">
                  <span className="font-semibold text-foreground">{f.clientName.split(' ')[0]}</span>{' '}
                  <span className="text-muted line-clamp-1" title={f.text}>{f.text}</span>
                </div>
                <div className="text-right">
                  <div className="text-[10.5px] font-mono text-muted">{feedWhen(f.at)}</div>
                  <div className={`text-[10px] font-mono ${f.source === 'client' ? 'text-success' : f.source === 'plugin' ? 'text-primary' : 'text-muted'}`}>{sourceLabel(f.source, f.author)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Aktive Kunden: Stand auf einen Blick */}
      <section className="card-static p-4 space-y-2">
        <div className="flex items-baseline justify-between"><span className={LABEL}>Aktive Kunden</span><span className="text-[11px] font-mono text-muted">{active.length} · dringend zuerst</span></div>
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[minmax(0,2.2fr)_120px_minmax(0,1.4fr)_70px_90px_90px_60px_minmax(0,1.2fr)] gap-3 px-2 pb-1 text-[10px] font-mono uppercase tracking-[0.08em] text-muted">
              <span>Kunde</span><span>Weg</span><span>Nächster Call</span><span>Workflows</span><span>Kunde dran</span><span>Kontakt</span><span>Stimmung</span><span>Signal</span>
            </div>
            {active.length === 0 && <div className="px-2 py-6 text-sm text-muted">Keine aktiven Kunden{filter !== 'Alle' ? ` bei ${filter}` : ''}.</div>}
            {active.map((r) => <RosterRow key={r.id} r={r} showCoach={filter === 'Alle'} />)}
          </div>
        </div>
      </section>

      {(completed.length > 0 || paused.length > 0) && (
        <div>
          <button type="button" onClick={() => setShowCompleted((v) => !v)} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground px-1 mb-2">
            {showCompleted ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            {completed.length} abgeschlossen{paused.length ? `, ${paused.length} pausiert` : ''}
            {!showCompleted && <span className="ml-2 flex -space-x-1.5">{[...paused, ...completed].slice(0, 8).map((c) => <Avatar key={c.id} name={c.clientName} size={20} />)}</span>}
          </button>
          {showCompleted && (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {[...paused, ...completed].map((r) => (
                <Link key={r.id} href={`/admin/coaching/${r.id}`} className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-[13px] text-muted hover:text-foreground hover:border-primary/40">
                  <Avatar name={r.clientName} size={28} />
                  <span className="min-w-0"><span className="block font-medium text-foreground truncate">{r.clientName}</span><span className="block text-[11px] truncate">{r.company ?? ''}</span></span>
                  <span className="ml-auto flex items-center gap-2 font-mono text-[10.5px] whitespace-nowrap">
                    <span className="inline-flex items-center gap-0.5">{r.goals.map((g, i) => <span key={i} className={`h-2 w-2 rounded-full ${GOAL_STATUS_META[g].dot}`} />)}</span>
                    {r.nps != null && <span>NPS {r.nps}</span>}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {creating && <NewEnrollmentModal programs={programs} onClose={() => setCreating(false)} />}
    </div>
  )
}

/** Fünf Arbeitstage ab heute. Was auf Samstag oder Sonntag fällt, rutscht auf den Montag. */
function workdays(from: Date, n: number): Date[] {
  const out: Date[] = []
  const d = new Date(from)
  while (out.length < n) {
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}
function workdayFor(iso: string, days: Date[]): number {
  const d = new Date(iso); d.setHours(0, 0, 0, 0)
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  return days.findIndex((x) => x.getTime() === d.getTime())
}

function WeekAgenda({ calls, todos, showCoach }: { calls: UpcomingItem[]; todos: HomeTodo[]; showCoach: boolean }) {
  const opt = useOptimisticTasks(todos.map((t) => ({ ...t, id: t.taskId })))
  const [today] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })
  const [showLate, setShowLate] = useState(false)
  const days = workdays(today, 5)
  const late = opt.display.filter((t) => new Date(t.dueAt).getTime() < today.getTime())
  const lateOpen = late.filter((t) => t.status === 'open')
  const byDay = days.map((_, i) => ({
    calls: calls.filter((c) => workdayFor(c.at, days) === i),
    todos: opt.display.filter((t) => new Date(t.dueAt).getTime() >= today.getTime() && workdayFor(t.dueAt, days) === i),
  }))
  const openTotal = opt.display.filter((t) => t.status === 'open' && new Date(t.dueAt).getTime() >= today.getTime()).length
  const prepOpen = opt.display.filter((t) => t.status === 'open' && t.isPrep).length
  const isWeekend = (iso: string) => { const g = new Date(iso).getDay(); return g === 0 || g === 6 }

  return (
    <section className="card-static p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <span className={LABEL}>Deine Woche</span>
        <span className="text-[11px] font-mono text-muted">{calls.filter((c) => workdayFor(c.at, days) >= 0).length} Calls · {openTotal} To-dos{prepOpen ? ` · ${prepOpen} Vorbereitung${prepOpen === 1 ? '' : 'en'}` : ''}</span>
      </div>
      {opt.error && <p className="text-xs text-danger">{opt.error}</p>}

      {late.length > 0 && (
        <div className="rounded-xl border border-danger/40 bg-danger/5 px-3 py-2 space-y-1">
          <button type="button" onClick={() => setShowLate((v) => !v)} className="flex w-full items-center justify-between text-left">
            <span className="flex items-center gap-2 text-[12.5px] font-semibold text-danger"><span className="h-2 w-2 rounded-full bg-danger" /> {lateOpen.length} überfällig</span>
            <span className="flex items-center gap-2">
              <span className="flex -space-x-1.5">{[...new Map(lateOpen.map((t) => [t.enrollmentId, t])).values()].slice(0, 6).map((t) => <Avatar key={t.enrollmentId} name={t.clientName} size={20} />)}</span>
              <span className="text-[10.5px] font-mono text-danger">{showLate ? 'zuklappen' : 'anzeigen'}</span>
            </span>
          </button>
          {showLate && (
            <div className="pt-1 grid gap-0.5 sm:grid-cols-2">
              {late.map((t) => <TodoLine key={t.id} t={t} opt={opt} showCoach={showCoach} late />)}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="grid grid-cols-5 gap-2 min-w-[820px]">
          {days.map((d, i) => {
            const isToday = i === 0
            const { calls: dayCalls, todos: dayTodos } = byDay[i]
            const openHere = dayTodos.filter((t) => t.status === 'open').length
            return (
              <div key={i} className={`rounded-xl border p-2 min-h-[150px] space-y-1.5 ${isToday ? 'border-primary/50 bg-primary/5' : 'border-border bg-background'}`}>
                <div className="flex items-baseline justify-between px-0.5">
                  <span className={`text-[12px] font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>{isToday ? 'Heute' : i === 1 && d.getTime() === today.getTime() + DAY ? 'Morgen' : d.toLocaleDateString('de-DE', { weekday: 'long' })}</span>
                  <span className="text-[10px] font-mono text-muted">{d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}{openHere ? ` · ${openHere}` : ''}</span>
                </div>
                {dayCalls.map((c) => (
                  <Link key={`${c.enrollmentId}-${c.at}`} href={`/admin/coaching/${c.enrollmentId}`} className={`block rounded-lg border px-2 py-1.5 bg-surface hover:border-primary/60 transition-colors ${c.blocker ? 'border-danger/50' : c.prepOpen ? 'border-warning/50' : 'border-primary/30'}`} title={`${c.clientName} · ${c.title}${c.goal ? ` · ${c.goal}` : ''}`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Video size={11} className="text-primary shrink-0" />
                      <Avatar name={c.clientName} size={18} />
                      <span className="text-[12px] font-bold text-foreground truncate">{c.clientName.split(' ')[0]}</span>
                      <span className="ml-auto text-[10.5px] font-mono text-foreground">{new Date(c.at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="mt-0.5 text-[10.5px] font-mono text-muted truncate">{c.title.split(' · ')[0]}{c.prepOpen ? ' · Prep offen' : ''}{c.blocker ? ' · Blocker' : ''}</div>
                  </Link>
                ))}
                {dayTodos.length > 0 && <div className="pt-0.5">{dayTodos.map((t) => <TodoLine key={t.id} t={t} opt={opt} showCoach={showCoach} weekend={isWeekend(t.dueAt)} />)}</div>}
                {dayCalls.length === 0 && dayTodos.length === 0 && <div className="px-0.5 pt-3 text-[11px] text-muted">frei</div>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function TodoLine({ t, opt, showCoach, late, weekend }: { t: HomeTodo & { id: string }; opt: ReturnType<typeof useOptimisticTasks<HomeTodo & { id: string }>>; showCoach: boolean; late?: boolean; weekend?: boolean }) {
  const done = t.status !== 'open'
  const due = new Date(t.dueAt)
  return (
    <div className={`grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-1.5 rounded-md px-0.5 py-1 ${done ? 'opacity-50' : ''}`}>
      <TaskCheck done={done} onToggle={() => opt.setStatus(t, done ? 'open' : 'done')} size={16} />
      <Link href={`/admin/coaching/${t.enrollmentId}`} className="min-w-0 group flex items-center gap-1.5">
        <Avatar name={t.clientName} size={16} />
        <span className={`text-[11.5px] truncate ${done ? 'line-through text-muted' : late ? 'text-danger' : 'text-foreground group-hover:text-primary'}`} title={`${t.clientName} · ${t.title}`}>
          {t.isPrep && <ClipboardList size={10} className="inline mr-0.5 -mt-0.5 text-primary" />}{t.title.split(' · ')[0]}
        </span>
      </Link>
      {opt.canUndo(t.id)
        ? <button type="button" onClick={() => opt.undo(t)} className="text-[10px] font-mono text-primary hover:underline"><Undo2 size={10} className="inline" /></button>
        : <span className={`text-[10px] font-mono ${late ? 'text-danger' : 'text-muted'}`} title={showCoach && t.coach ? t.coach : undefined}>{late ? due.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : weekend ? 'WE' : due.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
    </div>
  )
}

function RosterRow({ r, showCoach }: { r: HomeRow; showCoach: boolean }) {
  const hot = r.signals.some((s) => s.level === 'bad')
  const primary = r.signals.find((s) => s.level === 'bad') ?? r.signals.find((s) => s.level === 'warn') ?? r.signals.find((s) => s.level === 'ok') ?? r.signals[0]
  const total = r.openClient + r.doneClient
  const laneIdx = LANES.indexOf(r.lane)
  return (
    <Link href={`/admin/coaching/${r.id}`} className={`grid grid-cols-[minmax(0,2.2fr)_120px_minmax(0,1.4fr)_70px_90px_90px_60px_minmax(0,1.2fr)] items-center gap-3 rounded-xl border px-2 py-2 mb-1.5 bg-surface hover:border-primary/50 hover:shadow-[var(--ht-shadow-card)] transition-all ${hot ? 'border-danger/40' : 'border-border'}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar name={r.clientName} size={30} ring={hot ? 'bad' : undefined} />
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-foreground truncate">{r.clientName}</div>
          <div className="text-[10.5px] font-mono text-muted truncate">{[r.company, showCoach ? r.coach : null].filter(Boolean).join(' · ')}</div>
        </div>
      </div>
      <div className="min-w-0" title={LANE_META[r.lane]}>
        <div className="grid grid-cols-6 gap-0.5">
          {LANES.map((l, i) => <span key={l} className={`h-1.5 rounded-full ${i < laneIdx ? 'bg-success' : i === laneIdx ? 'bg-primary' : 'bg-border'}`} />)}
        </div>
        <div className="mt-1 text-[10px] font-mono text-muted truncate">{r.phase}</div>
      </div>
      <div className="min-w-0 text-[12px]">
        {r.nextAt ? (
          <><div className="font-semibold text-foreground truncate">{shortDate(r.nextAt)} · {new Date(r.nextAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div><div className="text-[10.5px] font-mono text-muted truncate">{r.nextTitle?.split(' · ')[0]}{r.nextPrepOpen ? ' · Prep offen' : ''}</div></>
        ) : <span className="text-danger font-semibold">Termin fehlt</span>}
      </div>
      <div className="flex items-center gap-1" title={r.goals.map((g) => GOAL_STATUS_META[g].label).join(', ')}>
        {r.goals.map((g, i) => <span key={i} className={`h-2.5 w-2.5 rounded-full ${GOAL_STATUS_META[g].dot}`} />)}
        {r.goals.length === 0 && <span className="text-[10.5px] text-muted">–</span>}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 flex-1 rounded-full bg-border overflow-hidden"><span className={`block h-full ${r.overdueClient ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${total ? (r.doneClient / total) * 100 : 0}%` }} /></span>
          <span className="text-[10.5px] font-mono text-muted tabular-nums">{r.doneClient}/{total}</span>
        </div>
        {r.overdueClient > 0 && <div className="text-[10px] font-mono text-danger mt-0.5">{r.overdueClient} überfällig</div>}
      </div>
      <div className="text-[11px] min-w-0">
        {r.lastContact ? <><div className="text-foreground">{relativeDays(r.lastContact.at)}</div><div className="text-[10px] font-mono text-muted truncate">{r.lastContact.label}</div></> : <span className="text-muted">–</span>}
      </div>
      <div><MoodDots score={r.mood?.score ?? null} size={6} /></div>
      <div className="min-w-0">
        {primary ? <span className={`inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[10.5px] font-mono ${primary.level === 'bad' ? 'bg-danger/15 text-danger' : primary.level === 'warn' ? 'bg-warning/15 text-warning' : primary.level === 'ok' ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary'}`}>{primary.label}</span> : <span className="inline-block rounded-full px-2 py-0.5 text-[10.5px] font-mono bg-success/15 text-success">läuft</span>}
      </div>
    </Link>
  )
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function nextTime(r: HomeRow): number {
  return r.nextAt ? new Date(r.nextAt).getTime() : Infinity
}

function shortDate(iso: string): string {
  const rel = relativeDays(iso)
  if (rel === 'heute' || rel === 'morgen' || rel === 'gestern') return rel
  return new Date(iso).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function summarizeAttention(rows: HomeRow[]): string {
  const blockers = rows.filter((r) => r.blocker).length
  const noDate = rows.filter((r) => r.signals.some((s) => s.label === 'Termin fehlt')).length
  return [blockers ? `${blockers} Blocker` : '', noDate ? `${noDate} ohne Termin` : ''].filter(Boolean).join(' · ') || `${rows.length} offen`
}

function feedWhen(iso: string): string {
  const rel = relativeDays(iso)
  if (rel === 'heute') return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  return rel
}

function sourceLabel(source: EventSource, author: string | null): string {
  if (source === 'client') return 'Kunde'
  if (source === 'plugin') return 'Plugin'
  if (source === 'system') return 'System'
  return author?.split(' ')[0] ?? 'Coach'
}

function feedText(f: FeedItem): string {
  const b = f.body ? f.body.replace(/\s+/g, ' ').trim() : ''
  switch (f.kind) {
    case 'client_win': return `meldet: läuft. „${b}“`
    case 'client_blocker': return `meldet Blocker: „${b}“`
    case 'task_done': return `hat abgehakt: ${b}`
    case 'coach_reply': return `Antwort an den Kunden: „${b}“`
    case 'schedule_change': return `Termin: ${b}`
    case 'sync': return `Nachbereitung eingespielt: ${b}`
    case 'whatsapp_in': return `WhatsApp vom Kunden: „${b}“`
    case 'whatsapp_out': return `WhatsApp an den Kunden: „${b}“`
    case 'milestone_done': return `${b} abgeschlossen`
    default: return b
  }
}

function groupFeed(items: FeedItem[]): Array<{ enrollmentId: string; clientName: string; at: string; text: string; source: EventSource; author: string | null }> {
  const out: Array<{ enrollmentId: string; clientName: string; at: string; text: string; source: EventSource; author: string | null; n: number; kind: EventKind }> = []
  for (const f of items) {
    const last = out[out.length - 1]
    if (last && last.kind === 'task_done' && f.kind === 'task_done' && last.enrollmentId === f.enrollmentId) {
      last.n += 1
      last.text = `hat ${last.n} Aufgaben abgehakt`
      continue
    }
    out.push({ enrollmentId: f.enrollmentId, clientName: f.clientName, at: f.at, text: feedText(f), source: f.source, author: f.author, n: 1, kind: f.kind })
  }
  return out
}
