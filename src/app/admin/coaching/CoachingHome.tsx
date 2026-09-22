'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart3, ChevronDown, ChevronRight, Loader2, Plus, Video } from 'lucide-react'
import type { EnrollmentStatus, EventKind, EventSource, GoalStatus } from '@/lib/coaching/types'
import { COACH_OPTIONS, GOAL_STATUS_META } from '@/lib/coaching/types'
import type { Lane, Signal } from '@/lib/coaching/derive'
import { LANE_META, relativeDays } from '@/lib/coaching/derive'
import { Avatar, MoodDots } from '@/components/coaching/visual'
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

export function CoachingHome({ rows, upcoming, feed, programs, clientAccess, slackConfigured }: {
  rows: HomeRow[]
  upcoming: UpcomingItem[]
  feed: FeedItem[]
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

      {/* Wochenleiste */}
      <section className="card-static p-4 space-y-3">
        <div className="flex items-baseline justify-between"><span className={LABEL}>Die nächsten sieben Tage</span><span className="text-[11px] font-mono text-muted">{calls.length} Call{calls.length === 1 ? '' : 's'}</span></div>
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="grid grid-cols-7 gap-2 min-w-[760px]">
            {days.map((d, i) => {
              const list = callsByDay[i]
              const isToday = i === 0
              const weekend = d.getDay() === 0 || d.getDay() === 6
              return (
                <div key={i} className={`rounded-xl border p-2 min-h-[112px] space-y-1.5 ${isToday ? 'border-primary/50 bg-primary/5' : weekend ? 'border-border/60 bg-surface-secondary/40' : 'border-border bg-background'}`}>
                  <div className="flex items-baseline justify-between px-0.5">
                    <span className={`text-[11px] font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>{isToday ? 'Heute' : i === 1 ? 'Morgen' : d.toLocaleDateString('de-DE', { weekday: 'short' })}</span>
                    <span className="text-[10px] font-mono text-muted">{d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
                  </div>
                  {list.map((c) => (
                    <Link key={`${c.enrollmentId}-${c.at}`} href={`/admin/coaching/${c.enrollmentId}`} className={`block rounded-lg border px-2 py-1.5 bg-surface hover:border-primary/60 transition-colors ${c.blocker ? 'border-danger/50' : c.prepOpen ? 'border-warning/50' : 'border-border'}`} title={`${c.clientName} · ${c.title}${c.goal ? ` · ${c.goal}` : ''}`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar name={c.clientName} size={20} />
                        <span className="text-[12px] font-semibold text-foreground truncate">{c.clientName.split(' ')[0]}</span>
                        <span className="ml-auto text-[10.5px] font-mono text-muted">{new Date(c.at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[10.5px] font-mono text-muted truncate">
                        <span className="truncate">{c.title}</span>
                        {c.meetingUrl && <Video size={10} className="text-primary shrink-0" />}
                      </div>
                    </Link>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </section>

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

      {/* Board */}
      <section className="card-static p-4 space-y-3">
        <div className="flex items-baseline justify-between"><span className={LABEL}>Wo alle stehen</span><span className="text-[11px] font-mono text-muted">{active.length} aktiv · dringend zuerst</span></div>
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="grid grid-cols-6 gap-2 min-w-[900px]">
            {LANES.map((lane) => {
              const list = active.filter((r) => r.lane === lane)
              return (
                <div key={lane} className="rounded-xl border border-border bg-background p-2 min-h-[140px] space-y-1.5">
                  <div className="flex items-center justify-between px-1 pb-1">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.08em] text-muted"><i className={`h-1.5 w-1.5 rounded-full ${LANE_COLOR[lane]}`} />{LANE_META[lane]}</span>
                    <span className="text-[10px] font-mono text-muted">{list.length}</span>
                  </div>
                  {list.map((r) => <BoardChip key={r.id} r={r} showCoach={filter === 'Alle'} />)}
                </div>
              )
            })}
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

function BoardChip({ r, showCoach }: { r: HomeRow; showCoach: boolean }) {
  const hot = r.signals.some((s) => s.level === 'bad')
  const total = r.openClient + r.doneClient
  const pct = total ? Math.round((r.doneClient / total) * 100) : 0
  return (
    <Link href={`/admin/coaching/${r.id}`} className={`block rounded-lg border bg-surface px-2 py-2 hover:border-primary/60 hover:shadow-[var(--ht-shadow-card)] transition-all ${hot ? 'border-danger/50' : 'border-border'}`}>
      <div className="flex items-center gap-2 min-w-0">
        <Avatar name={r.clientName} size={24} ring={hot ? 'bad' : undefined} />
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold text-foreground truncate">{r.clientName}</div>
          <div className="text-[10.5px] font-mono text-muted truncate">{r.nextAt ? `${r.nextTitle?.split(' · ')[0]} · ${shortDate(r.nextAt)}` : 'Termin fehlt'}{showCoach && r.coach ? ` · ${r.coach}` : ''}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="h-1 flex-1 rounded-full bg-border overflow-hidden"><span className="block h-full bg-primary" style={{ width: `${pct}%` }} /></span>
        <span className="inline-flex items-center gap-0.5">{r.goals.map((g, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${GOAL_STATUS_META[g].dot}`} />)}</span>
        <MoodDots score={r.mood?.score ?? null} size={4} />
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
