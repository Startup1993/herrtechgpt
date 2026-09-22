'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, BarChart3, ChevronDown, ChevronRight, Loader2, Plus, Video } from 'lucide-react'
import type { EnrollmentStatus, EventKind, EventSource, GoalStatus } from '@/lib/coaching/types'
import { COACH_OPTIONS, GOAL_STATUS_META } from '@/lib/coaching/types'
import type { Lane, Signal } from '@/lib/coaching/derive'
import { LANE_META, relativeDays } from '@/lib/coaching/derive'
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

const SIGNAL_CLASS: Record<Signal['level'], string> = {
  ok: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  warn: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  bad: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  info: 'bg-primary/10 text-primary',
}
const LABEL = 'text-[11px] font-mono uppercase tracking-[0.12em] text-primary font-semibold'
const LANES: Lane[] = ['vor_kickoff', 'w1', 'w2', 'w3', 'w4', 'nachlauf']
const FILTER_KEY = 'coaching.coachFilter'

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

  function pick(f: CoachFilter) { writeFilter(f) }

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
  const inWeeks = laneCounts.filter((x) => x.lane.startsWith('w')).reduce((s, x) => s + x.n, 0)
  const today = new Date()

  return (
    <div className="space-y-6">
      {/* Kopf */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className={LABEL}>Coaching-Cockpit · {today.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })}</div>
          <h1 className="text-2xl font-bold text-foreground mt-1">Heute</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 rounded-lg border border-border bg-surface p-0.5">
            {(['Alle', ...COACH_OPTIONS] as CoachFilter[]).map((f) => (
              <button key={f} type="button" onClick={() => pick(f)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${filter === f ? 'bg-primary/15 text-primary' : 'text-muted hover:text-foreground'}`}>{f}</button>
            ))}
          </div>
          <Link href="/admin/coaching/stats" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover"><BarChart3 size={14} /> Statistik</Link>
          <button type="button" onClick={() => setCreating(true)} className="btn-primary !py-1.5 !px-3 !text-xs"><Plus size={14} /> Kunde</button>
        </div>
      </div>

      {/* Kennzahlen */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Aktiv" value={String(active.length)} sub={`${laneCounts[0].n} vor Kickoff · ${inWeeks} in den Wochen · ${laneCounts[5].n} im Nachlauf${paused.length ? ` · ${paused.length} pausiert` : ''}`} />
        <Kpi label="Calls diese Woche" value={String(calls.length)} sub={calls[0] ? `nächster ${relativeDays(calls[0].at)} · ${calls[0].clientName.split(' ')[0]}` : 'keiner terminiert'} />
        <Kpi label="Braucht dich" value={String(attention.length)} tone={attention.length ? 'bad' : 'ok'} sub={attention.length ? summarizeAttention(attention) : 'alles ruhig'} />
        <button type="button" onClick={toggleAccess} disabled={togglingAccess} className={`card-static p-4 text-left grid gap-0.5 hover:border-primary/40 transition-colors ${access ? '' : ''}`} title="Klick schaltet um">
          <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted">Kunden-Zugang</span>
          <span className={`text-xl font-bold flex items-center gap-2 ${access ? 'text-success' : 'text-warning'}`}>{togglingAccess ? <Loader2 size={16} className="animate-spin" /> : null}{access ? 'an' : 'aus'}</span>
          <span className="text-xs text-muted">{rows.filter((r) => r.invitedAt).length} eingeladen · Slack {slackConfigured ? 'verbunden' : 'fehlt'}</span>
        </button>
      </div>

      {/* Termine · Braucht dich · Passiert */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section className="card-static p-4 space-y-2.5">
          <div className="flex items-baseline justify-between"><span className={LABEL}>Nächste Calls</span><span className="text-[11px] font-mono text-muted">7 Tage</span></div>
          {calls.length === 0 && <p className="text-sm text-muted py-4">Kein Call in den nächsten sieben Tagen. Wenn das nicht stimmt, fehlt ein Termin, siehe „Braucht dich“.</p>}
          {calls.map((c, i) => (
            <div key={`${c.enrollmentId}-${c.at}`} className={`grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-2.5 ${i === 0 ? 'border-primary/40 bg-primary/5' : 'border-border bg-background'}`}>
              <div className="font-mono text-[11px] text-primary leading-tight">
                {new Date(c.at).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                <div className="text-[15px] font-bold text-foreground">{new Date(c.at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate"><Link href={`/admin/coaching/${c.enrollmentId}`} className="hover:text-primary">{c.clientName}</Link> · {c.title}</div>
                <div className="text-xs text-muted truncate">{relativeDays(c.at)}{c.goal ? ` · ${c.goal}` : ''}{filter === 'Alle' && c.coach ? ` · ${c.coach}` : ''}</div>
              </div>
              <div className="flex items-center gap-1.5">
                {c.blocker && <span className={`hidden sm:inline rounded-full px-2 py-0.5 text-[11px] font-mono ${SIGNAL_CLASS.bad}`}>Blocker</span>}
                {c.prepOpen && <span className={`hidden sm:inline rounded-full px-2 py-0.5 text-[11px] font-mono ${SIGNAL_CLASS.warn}`}>Prep offen</span>}
                {c.meetingUrl && <a href={c.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-surface-hover" title="Meeting öffnen"><Video size={12} /> Meet</a>}
                <Link href={`/admin/coaching/${c.enrollmentId}`} className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${i === 0 ? 'bg-primary text-white hover:bg-primary-hover' : 'border border-border text-foreground hover:bg-surface-hover'}`}>{c.prepOpen ? 'Vorbereiten' : 'Öffnen'}</Link>
              </div>
            </div>
          ))}
        </section>

        <div className="space-y-4">
          <section className="card-static p-4 space-y-2.5">
            <div className="flex items-baseline justify-between"><span className={LABEL}>Braucht dich</span><span className="text-[11px] font-mono text-muted">{attention.length} Kunde{attention.length === 1 ? '' : 'n'}</span></div>
            {attention.length === 0 && <p className="text-sm text-muted py-2">Alles ruhig. Kein Blocker, kein fehlender Termin.</p>}
            {attention.map((r) => (
              <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><AlertTriangle size={13} className="text-danger shrink-0" /><Link href={`/admin/coaching/${r.id}`} className="text-sm font-semibold text-foreground hover:text-primary truncate">{r.clientName}</Link></div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {r.signals.filter((s) => s.level === 'bad').map((s, i) => <span key={i} className={`rounded-full px-2 py-0.5 text-[11px] font-mono ${SIGNAL_CLASS.bad}`}>{s.label}{s.label === 'Blocker offen' && r.blocker ? ` · ${relativeDays(r.blocker.at)}` : ''}</span>)}
                  </div>
                  {r.blocker?.body && <div className="mt-1 text-xs text-muted truncate" title={r.blocker.body}>„{r.blocker.body}“</div>}
                </div>
                <Link href={`/admin/coaching/${r.id}?tab=${r.blocker ? 'history' : 'sessions'}`} className="rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-primary-hover whitespace-nowrap">{r.blocker ? 'Antworten' : 'Termin setzen'}</Link>
              </div>
            ))}
          </section>

          <section className="card-static p-4 space-y-2.5">
            <div className="flex items-baseline justify-between"><span className={LABEL}>Passiert</span><span className="text-[11px] font-mono text-muted">48 h · Kunde · Plugin · Coach</span></div>
            {events.length === 0 && <p className="text-sm text-muted py-2">Nichts Neues in den letzten zwei Tagen.</p>}
            <div className="space-y-2">
              {groupFeed(events).map((f, i) => (
                <div key={i} className="grid grid-cols-[56px_minmax(0,1fr)] gap-2.5 text-[13px] items-baseline">
                  <span className="font-mono text-[11px] text-muted">{feedWhen(f.at)}</span>
                  <div className="min-w-0">
                    <Link href={`/admin/coaching/${f.enrollmentId}`} className="font-semibold text-foreground hover:text-primary">{f.clientName.split(' ')[0]}</Link>{' '}
                    <span className="text-muted">{f.text}</span>
                    <span className="ml-1.5 font-mono text-[10px] text-primary">{sourceLabel(f.source, f.author)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Board */}
      <section className="card-static p-4 space-y-3">
        <div className="flex items-baseline justify-between"><span className={LABEL}>Wo alle stehen</span><span className="text-[11px] font-mono text-muted">{active.length} aktiv · sortiert nach Dringlichkeit</span></div>
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="grid grid-cols-6 gap-2 min-w-[880px]">
            {LANES.map((lane) => {
              const list = active.filter((r) => r.lane === lane)
              return (
                <div key={lane} className="rounded-xl border border-border bg-background p-2 min-h-[120px] space-y-1.5">
                  <div className="flex justify-between px-1 pb-1 text-[10px] font-mono uppercase tracking-[0.08em] text-muted"><span>{LANE_META[lane]}</span><span>{list.length}</span></div>
                  {list.map((r) => <BoardChip key={r.id} r={r} showCoach={filter === 'Alle'} />)}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pausiert / Abgeschlossen */}
      {(completed.length > 0 || paused.length > 0) && (
        <div>
          <button type="button" onClick={() => setShowCompleted((v) => !v)} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground px-1 mb-2">
            {showCompleted ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            {completed.length} abgeschlossen{paused.length ? `, ${paused.length} pausiert` : ''}{showCompleted ? '' : ` · ${[...paused, ...completed].map((c) => c.clientName.split(' ')[0]).join(', ')}`}
          </button>
          {showCompleted && (
            <div className="space-y-1.5">
              {[...paused, ...completed].map((r) => (
                <Link key={r.id} href={`/admin/coaching/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border/60 bg-surface/60 px-4 py-2 text-[13px] text-muted hover:text-foreground hover:border-primary/40">
                  <span className="font-medium text-foreground">{r.clientName}</span>
                  {r.company && <span className="truncate">{r.company}</span>}
                  <span className="ml-auto flex items-center gap-3 font-mono text-[11px]">
                    <span>{r.status === 'paused' ? 'pausiert' : 'abgeschlossen'}</span>
                    {r.coach && <span>{r.coach}</span>}
                    <span className="inline-flex items-center gap-1">{r.goals.map((g, i) => <span key={i} className={`h-2 w-2 rounded-full ${GOAL_STATUS_META[g].dot}`} />)}</span>
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

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'bad' | 'ok' }) {
  return (
    <div className="card-static p-4 grid gap-0.5">
      <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted">{label}</span>
      <span className={`text-2xl font-extrabold tracking-tight tabular-nums ${tone === 'bad' ? 'text-danger' : 'text-foreground'}`}>{value}</span>
      <span className="text-xs text-muted truncate" title={sub}>{sub}</span>
    </div>
  )
}

function BoardChip({ r, showCoach }: { r: HomeRow; showCoach: boolean }) {
  const hot = r.signals.some((s) => s.level === 'bad')
  return (
    <Link href={`/admin/coaching/${r.id}`} className={`block rounded-lg border bg-surface px-2 py-1.5 hover:border-primary/50 ${hot ? 'border-danger/50' : 'border-border'}`}>
      <div className="text-[12.5px] font-semibold text-foreground truncate">{r.clientName}</div>
      <div className="text-[11px] font-mono text-muted truncate">
        {r.nextAt ? `${r.nextTitle} · ${shortDate(r.nextAt)}` : r.status === 'active' ? 'Termin fehlt' : '–'}{showCoach && r.coach ? ` · ${r.coach}` : ''}
      </div>
      <div className="mt-1 flex items-center gap-1">
        {r.goals.map((g, i) => <span key={i} className={`h-2 w-2 rounded-full ${GOAL_STATUS_META[g].dot}`} />)}
        {r.blocker && <span className="ml-auto text-[10px] font-mono text-danger">Blocker</span>}
      </div>
    </Link>
  )
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
  const short = b.length > 90 ? `${b.slice(0, 88)}…` : b
  switch (f.kind) {
    case 'client_win': return `meldet: läuft. „${short}“`
    case 'client_blocker': return `meldet Blocker: „${short}“`
    case 'task_done': return `hat abgehakt: ${short}`
    case 'coach_reply': return `Antwort an den Kunden: „${short}“`
    case 'schedule_change': return `Termin: ${short}`
    case 'sync': return `Nachbereitung eingespielt: ${short}`
    case 'whatsapp_in': return `WhatsApp vom Kunden: „${short}“`
    case 'whatsapp_out': return `WhatsApp an den Kunden: „${short}“`
    case 'milestone_done': return `${short} abgeschlossen`
    default: return short
  }
}

/** Mehrere Haken desselben Kunden hintereinander werden eine Zeile. */
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
