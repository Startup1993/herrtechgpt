'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, BarChart3, Check, ChevronDown, ChevronRight, Loader2, Plus, Sparkles, Video, X } from 'lucide-react'
import type { EnrollmentStatus, GoalStatus, TaskKind } from '@/lib/coaching/types'
import { COACH_OPTIONS, ENROLLMENT_STATUS_META, GOAL_STATUS_META, TRACK_OPTIONS, WORLD_MODE_META } from '@/lib/coaching/types'
import type { Signal } from '@/lib/coaching/derive'
import { fmtDate, relativeDays } from '@/lib/coaching/derive'

export interface ListRow {
  id: string
  clientName: string
  company: string | null
  coach: string | null
  status: EnrollmentStatus
  programTitle: string
  phase: string
  nextAt: string | null
  nextTitle: string | null
  openTasks: number
  overdue: number
  lastContact: { label: string; at: string } | null
  mood: { score: number; note: string | null; at: string } | null
  moodTrend: number[]
  signals: Signal[]
  progress: number
  goals: GoalStatus[]
  hasProfile: boolean
  invitedAt: string | null
  nps: number | null
}

export interface TodoItem {
  taskId: string
  title: string
  dueAt: string | null
  kind: TaskKind
  overdue: boolean
}

export interface TodoGroup {
  enrollmentId: string
  clientName: string
  items: TodoItem[]
}

export interface UpcomingItem {
  enrollmentId: string
  clientName: string
  title: string
  at: string
  meetingUrl: string | null
}

export interface AttentionItem {
  enrollmentId: string
  clientName: string
  labels: string[]
}

export interface RecentItem {
  enrollmentId: string
  clientName: string
  labels: string[]
  at: string | null
}

const SIGNAL_CLASS: Record<Signal['level'], string> = {
  ok: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  warn: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  bad: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  info: 'bg-primary/10 text-primary',
}

const LABEL = 'text-[11px] font-mono uppercase tracking-[0.12em] text-primary font-semibold'

export function CoachingList({ rows, todos, upcoming, attention, recent, programs, clientAccess, slackConfigured }: {
  rows: ListRow[]
  todos: TodoGroup[]
  upcoming: UpcomingItem[]
  attention: AttentionItem[]
  recent: RecentItem[]
  programs: Array<{ key: string; title: string }>
  clientAccess: boolean
  slackConfigured: boolean
}) {
  const router = useRouter()
  const [showCompleted, setShowCompleted] = useState(false)
  const [creating, setCreating] = useState(false)
  const [access, setAccess] = useState(clientAccess)
  const [togglingAccess, setTogglingAccess] = useState(false)

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

  const active = rows.filter((r) => r.status !== 'completed')
  const completed = rows.filter((r) => r.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Steuerleiste */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={toggleAccess}
          disabled={togglingAccess}
          title={access ? 'Kunden sehen ihr Dashboard, Einladungen und Antwort-Mails gehen raus. Klick zum Ausschalten.' : 'Nur intern sichtbar, keine Kunden-Mails. Klick zum Anschalten.'}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${access ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300' : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'}`}
        >
          {togglingAccess ? <Loader2 size={12} className="animate-spin" /> : <span className={`h-2 w-2 rounded-full ${access ? 'bg-green-500' : 'bg-amber-500'}`} />}
          Kunden-Zugang {access ? 'an' : 'aus'}
        </button>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted" title={slackConfigured ? 'Blocker, Erfolge und der Tages-Digest gehen in den Slack-Channel.' : 'SLACK_COACHING_WEBHOOK_URL fehlt, Blocker gehen per Mail.'}>
          <span className={`h-2 w-2 rounded-full ${slackConfigured ? 'bg-green-500' : 'bg-border'}`} /> Slack {slackConfigured ? 'verbunden' : 'fehlt'}
        </span>
        <span className="text-xs text-muted px-1">{active.length} aktiv · {completed.length} abgeschlossen</span>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/admin/coaching/stats" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover"><BarChart3 size={14} /> Statistik</Link>
          <button type="button" onClick={() => setCreating(true)} className="btn-primary !py-1.5 !px-3 !text-xs"><Plus size={14} /> Neue Teilnahme</button>
        </div>
      </div>

      {/* Fokus: Heute · Braucht dich · Neu */}
      <div className="grid gap-4 lg:grid-cols-3">
        <TodayCard todos={todos} upcoming={upcoming} />
        <AttentionCard items={attention} />
        <RecentCard items={recent} />
      </div>

      {/* Kunden */}
      <section className="space-y-5">
        {groupByCoach(active).map(([coach, list]) => (
          <div key={coach}>
            <div className="flex items-baseline justify-between mb-2 px-1">
              <h2 className="text-sm font-semibold text-foreground">{coach}</h2>
              <span className="text-xs text-muted font-mono">{list.length} Kunde{list.length === 1 ? '' : 'n'}</span>
            </div>
            <div className="space-y-2">
              {list.map((r) => <CustomerCard key={r.id} r={r} />)}
            </div>
          </div>
        ))}
        {active.length === 0 && (
          <div className="card-static p-8 text-center text-sm text-muted">Noch keine aktive Teilnahme. Neue Kunden kommen über das Plugin (<code>/neuer-kunde</code>) oder über „Neue Teilnahme“.</div>
        )}

        {completed.length > 0 && (
          <div>
            <button type="button" onClick={() => setShowCompleted((v) => !v)} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground px-1 mb-2">
              {showCompleted ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              {completed.length} abgeschlossen{showCompleted ? '' : ` · ${completed.map((c) => c.clientName.split(' ')[0]).join(', ')}`}
            </button>
            {showCompleted && (
              <div className="space-y-1.5">
                {completed.map((r) => <CompletedRow key={r.id} r={r} />)}
              </div>
            )}
          </div>
        )}
      </section>

      {creating && <NewEnrollmentModal programs={programs} onClose={() => setCreating(false)} />}
    </div>
  )
}

function groupByCoach(rows: ListRow[]): Array<[string, ListRow[]]> {
  const order = [...COACH_OPTIONS, 'Ohne Coach'] as string[]
  const map = new Map<string, ListRow[]>()
  for (const r of rows) {
    const key = r.coach && order.includes(r.coach) ? r.coach : r.coach ?? 'Ohne Coach'
    map.set(key, [...(map.get(key) ?? []), r])
  }
  return [...map.entries()]
    .sort((a, b) => (order.indexOf(a[0]) === -1 ? 99 : order.indexOf(a[0])) - (order.indexOf(b[0]) === -1 ? 99 : order.indexOf(b[0])))
    .map(([coach, list]) => [coach, list.sort((a, b) => urgency(b) - urgency(a) || nextTime(a) - nextTime(b))])
}

function urgency(r: ListRow): number {
  return r.signals.reduce((s, sig) => s + (sig.level === 'bad' ? 100 : sig.level === 'warn' ? 10 : 0), 0)
}

function nextTime(r: ListRow): number {
  return r.nextAt ? new Date(r.nextAt).getTime() : Infinity
}

/* ---------- Fokus-Karten ---------- */

function TodayCard({ todos, upcoming }: { todos: TodoGroup[]; upcoming: UpcomingItem[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const total = todos.reduce((n, g) => n + g.items.length, 0)
  const overdue = todos.reduce((n, g) => n + g.items.filter((i) => i.overdue).length, 0)
  const visibleGroups = expanded ? todos : todos.slice(0, 3)

  async function done(taskId: string) {
    setBusy(taskId)
    await fetch('/api/admin/coaching/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: taskId, status: 'done' }) })
    setBusy(null)
    router.refresh()
  }

  return (
    <section className="card-static p-4 flex flex-col gap-3 min-h-[220px]">
      <div className="flex items-baseline justify-between">
        <div className={LABEL}>Heute</div>
        <span className="text-[11px] font-mono text-muted">{total} To-do{total === 1 ? '' : 's'}{overdue ? ` · ${overdue} überfällig` : ''}</span>
      </div>

      {upcoming.length > 0 && (
        <ul className="space-y-1.5">
          {upcoming.slice(0, 3).map((u) => (
            <li key={`${u.enrollmentId}-${u.at}`} className="flex items-center gap-2.5 rounded-lg bg-primary/5 border border-primary/15 px-2.5 py-2">
              <Video size={14} className="text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-mono text-primary">{relativeDays(u.at)} · {fmtDate(u.at, 'datetime')}</div>
                <div className="text-sm text-foreground truncate"><Link href={`/admin/coaching/${u.enrollmentId}`} className="font-semibold hover:text-primary">{u.clientName}</Link> · {u.title}</div>
              </div>
              {u.meetingUrl && <a href={u.meetingUrl} target="_blank" rel="noreferrer" className="text-[11px] font-mono text-primary hover:underline shrink-0">Meet</a>}
            </li>
          ))}
        </ul>
      )}

      {total === 0 ? (
        <p className="text-sm text-muted">Nichts zu schicken. Erinnerungen entstehen mit dem nächsten Termin.</p>
      ) : (
        <div className="space-y-2.5">
          {visibleGroups.map((g) => (
            <div key={g.enrollmentId}>
              <Link href={`/admin/coaching/${g.enrollmentId}`} className="text-xs font-semibold text-foreground hover:text-primary">{g.clientName}</Link>
              <ul className="mt-1 space-y-1">
                {g.items.slice(0, expanded ? undefined : 3).map((t) => (
                  <li key={t.taskId} className="flex items-center gap-2 min-w-0">
                    <button type="button" onClick={() => done(t.taskId)} disabled={busy === t.taskId} className="grid h-4 w-4 shrink-0 place-items-center rounded border-2 border-border hover:border-primary disabled:opacity-50" aria-label="Erledigt">
                      {busy === t.taskId ? <Loader2 size={9} className="animate-spin" /> : null}
                    </button>
                    <span className={`text-[10px] font-mono shrink-0 w-14 ${t.overdue ? 'text-danger' : 'text-muted'}`}>{t.dueAt ? shortDue(t.dueAt) : '—'}</span>
                    <span className="text-[13px] text-foreground truncate" title={t.title}>{shortTitle(t.title)}</span>
                  </li>
                ))}
                {!expanded && g.items.length > 3 && <li className="text-[11px] text-muted pl-6">+{g.items.length - 3} weitere</li>}
              </ul>
            </div>
          ))}
          {(todos.length > 3 || todos.some((g) => g.items.length > 3)) && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="text-xs text-primary hover:underline">{expanded ? 'weniger' : `alle ${total} anzeigen`}</button>
          )}
        </div>
      )}
    </section>
  )
}

function AttentionCard({ items }: { items: AttentionItem[] }) {
  return (
    <section className="card-static p-4 flex flex-col gap-3 min-h-[220px]">
      <div className="flex items-baseline justify-between">
        <div className={LABEL}>Braucht dich</div>
        <span className="text-[11px] font-mono text-muted">{items.length} Kunde{items.length === 1 ? '' : 'n'}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Alles ruhig. Kein Blocker, nichts überfällig, alle Termine stehen.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li key={a.enrollmentId} className="flex items-start gap-2.5">
              <AlertTriangle size={14} className="text-danger mt-0.5 shrink-0" />
              <div className="min-w-0">
                <Link href={`/admin/coaching/${a.enrollmentId}`} className="text-sm font-semibold text-foreground hover:text-primary">{a.clientName}</Link>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {a.labels.map((l, i) => <span key={i} className={`rounded-full px-2 py-0.5 text-[11px] font-mono ${SIGNAL_CLASS.bad}`}>{l}</span>)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function RecentCard({ items }: { items: RecentItem[] }) {
  return (
    <section className="card-static p-4 flex flex-col gap-3 min-h-[220px]">
      <div className="flex items-baseline justify-between">
        <div className={LABEL}>Neu seit gestern</div>
        <span className="text-[11px] font-mono text-muted">Plugin · Kunde · Coach</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Nichts Neues. Sobald das Plugin eine Nachbereitung schickt oder ein Kunde etwas abhakt, steht es hier.</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 6).map((r) => (
            <li key={r.enrollmentId} className="flex items-start gap-2.5">
              <Sparkles size={14} className="text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <Link href={`/admin/coaching/${r.enrollmentId}`} className="text-sm font-semibold text-foreground hover:text-primary">{r.clientName}</Link>
                  {r.at && <span className="text-[10px] font-mono text-muted">{relativeDays(r.at)}</span>}
                </div>
                <div className="text-xs text-muted truncate" title={r.labels.join(', ')}>{r.labels.join(' · ')}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ---------- Kunden-Karten ---------- */

function CustomerCard({ r }: { r: ListRow }) {
  const meta = ENROLLMENT_STATUS_META[r.status]
  const primary = r.signals.find((s) => s.level === 'bad') ?? r.signals.find((s) => s.level === 'warn') ?? r.signals.find((s) => s.level === 'ok') ?? r.signals[0]
  return (
    <Link href={`/admin/coaching/${r.id}`} className="card-static block px-4 py-3 hover:border-primary/40 transition-colors">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_auto] sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-foreground truncate">{r.clientName}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono ${meta.badge}`}>{r.phase}</span>
          </div>
          {r.company && <div className="text-xs text-muted truncate">{r.company}</div>}
        </div>

        <div className="text-[13px] font-mono">
          {r.nextAt ? (
            <>
              <div className="text-foreground">{fmtDate(r.nextAt, 'datetime')}</div>
              <div className="text-[11px] text-muted truncate">{relativeDays(r.nextAt)} · {r.nextTitle}</div>
            </>
          ) : (
            <span className={r.status === 'active' ? 'text-danger' : 'text-muted'}>{r.status === 'active' ? 'Termin fehlt' : '–'}</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[12px]">
          <span className="inline-flex items-center gap-1" title={r.goals.map((g) => GOAL_STATUS_META[g].label).join(', ')}>
            {r.goals.map((g, i) => <span key={i} className={`h-2.5 w-2.5 rounded-full ${GOAL_STATUS_META[g].dot}`} />)}
            {r.goals.length === 0 && <span className="text-muted">keine Workflows</span>}
          </span>
          <span className="text-muted whitespace-nowrap">{r.openTasks} offen{r.overdue ? <span className="text-danger"> · {r.overdue} überfällig</span> : null}</span>
          {r.mood && (
            <span className="inline-flex items-end gap-0.5 h-3.5" title={`Stimmung ${r.mood.score}${r.mood.note ? ` · ${r.mood.note}` : ''}`}>
              {r.moodTrend.map((s, i) => <i key={i} className={`block w-1 rounded-sm ${s <= 2 ? 'bg-danger' : s === 3 ? 'bg-warning' : 'bg-success'} ${i === r.moodTrend.length - 1 ? 'opacity-100' : 'opacity-40'}`} style={{ height: `${3 + s * 2}px` }} />)}
            </span>
          )}
        </div>

        <div className="flex sm:justify-end">
          {primary ? (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-mono whitespace-nowrap ${SIGNAL_CLASS[primary.level]}`}>{primary.label}</span>
          ) : (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-mono ${SIGNAL_CLASS.ok}`}>läuft</span>
          )}
        </div>
      </div>
    </Link>
  )
}

function CompletedRow({ r }: { r: ListRow }) {
  return (
    <Link href={`/admin/coaching/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border/60 bg-surface/60 px-4 py-2 text-[13px] text-muted hover:text-foreground hover:border-primary/40">
      <span className="font-medium text-foreground">{r.clientName}</span>
      {r.company && <span className="truncate">{r.company}</span>}
      <span className="ml-auto flex items-center gap-3 font-mono text-[11px]">
        {r.coach && <span>{r.coach}</span>}
        <span className="inline-flex items-center gap-1">{r.goals.map((g, i) => <span key={i} className={`h-2 w-2 rounded-full ${GOAL_STATUS_META[g].dot}`} />)}</span>
        {r.nps != null && <span>NPS {r.nps}</span>}
      </span>
    </Link>
  )
}

/* ---------- Helfer ---------- */

function shortDue(iso: string): string {
  const d = new Date(iso)
  const rel = relativeDays(iso)
  if (rel === 'heute') return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  if (rel === 'morgen' || rel === 'gestern') return rel
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

/** „Recap schicken · nach Call 3“ → „Recap schicken“ (Call 3 steht schon in der Gruppe bzw. im Tooltip). */
function shortTitle(title: string): string {
  const cut = title.split(' · ')[0]
  return cut.length > 48 ? `${cut.slice(0, 46)}…` : cut
}

/* ---------- Neue Teilnahme ---------- */

function NewEnrollmentModal({ programs, onClose }: { programs: Array<{ key: string; title: string }>; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({
    client_name: '', client_email: '', company: '', coach_name: 'Jacob', program_key: programs[0]?.key ?? 'coaching_1zu1',
    world_mode: 'program_only', track: '', starts_at: new Date().toISOString().slice(0, 10), status: 'active',
    north_star: '', success_quote: '', create_account: true, send_invite: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    const res = await fetch('/api/admin/coaching/enrollments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const json = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Fehler beim Anlegen'); return }
    if (json.invite_error) alert(`Teilnahme angelegt, Einladung fehlgeschlagen: ${json.invite_error}`)
    router.push(`/admin/coaching/${json.enrollment.id}`)
    router.refresh()
  }

  const input = 'w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-background border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Neue Teilnahme</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground p-1" aria-label="Schließen"><X size={18} /></button>
        </div>
        <p className="text-xs text-muted">Normalweg ist das Plugin (<code>/neuer-kunde</code>), damit Notion, Drive und Cockpit zusammenbleiben. Das hier ist der Handweg.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Name *</span><input required className={input} value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Vorname Nachname" /></label>
          <label className="block"><span className="text-xs font-medium text-muted mb-1 block">E-Mail</span><input type="email" className={input} value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} placeholder="kunde@firma.de" /></label>
          <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Firma</span><input className={input} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
          <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Coach</span>
            <select className={input} value={form.coach_name} onChange={(e) => setForm({ ...form, coach_name: e.target.value })}>{COACH_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
          <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Programm</span>
            <select className={input} value={form.program_key} onChange={(e) => setForm({ ...form, program_key: e.target.value })}>{programs.map((p) => <option key={p.key} value={p.key}>{p.title}</option>)}</select></label>
          <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Track</span>
            <select className={input} value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })}><option value="">offen</option>{TRACK_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
          <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Start</span><input type="date" className={input} value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></label>
          <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Status</span>
            <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">aktiv</option><option value="completed">abgeschlossen (Bestandskunde)</option><option value="paused">pausiert</option></select></label>
        </div>
        <label className="block"><span className="text-xs font-medium text-muted mb-1 block">World-Zugang</span>
          <select className={input} value={form.world_mode} onChange={(e) => setForm({ ...form, world_mode: e.target.value })}>
            {(Object.keys(WORLD_MODE_META) as Array<keyof typeof WORLD_MODE_META>).map((k) => <option key={k} value={k}>{WORLD_MODE_META[k].label} · {WORLD_MODE_META[k].hint}</option>)}
          </select></label>
        <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Nordstern (ein Satz)</span><input className={input} value={form.north_star} onChange={(e) => setForm({ ...form, north_star: e.target.value })} placeholder="Reichweite. Nur Reichweite." /></label>
        <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Erfolgs-Zitat (wörtlich aus dem Kickoff)</span><input className={input} value={form.success_quote} onChange={(e) => setForm({ ...form, success_quote: e.target.value })} placeholder="Masse Masse Masse" /></label>
        <div className="rounded-lg border border-border p-3 space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.create_account} disabled={!form.client_email} onChange={(e) => setForm({ ...form, create_account: e.target.checked, send_invite: e.target.checked ? form.send_invite : false })} /> World-Account anlegen oder verknüpfen (braucht E-Mail)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.send_invite} disabled={!form.create_account} onChange={(e) => setForm({ ...form, send_invite: e.target.checked })} /> Einladung „Dein Coaching-Zugang“ sofort senden</label>
          <p className="text-xs text-muted">Für abgeschlossene Bestandskunden beide Haken weglassen: Sie erscheinen im Cockpit und in der Statistik, bekommen aber keinen Login.</p>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Abbrechen</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Anlegen</button>
        </div>
      </form>
    </div>
  )
}
