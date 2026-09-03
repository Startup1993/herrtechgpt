'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Plus, X } from 'lucide-react'
import type { EnrollmentStatus, GoalStatus } from '@/lib/coaching/types'
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
  signals: Signal[]
  progress: number
  goals: GoalStatus[]
  hasProfile: boolean
  invitedAt: string | null
  nps: number | null
}

export interface TodayItem {
  taskId: string
  enrollmentId: string
  clientName: string
  title: string
  dueAt: string | null
  overdue: boolean
}

const SIGNAL_CLASS: Record<Signal['level'], string> = {
  ok: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  warn: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  bad: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  info: 'bg-primary/10 text-primary',
}

export function CoachingList({ rows, today, programs }: { rows: ListRow[]; today: TodayItem[]; programs: Array<{ key: string; title: string }> }) {
  const router = useRouter()
  const [showCompleted, setShowCompleted] = useState(false)
  const [creating, setCreating] = useState(false)
  const [busyTask, setBusyTask] = useState<string | null>(null)

  const active = rows.filter((r) => r.status !== 'completed').sort((a, b) => score(b) - score(a))
  const completed = rows.filter((r) => r.status === 'completed')
  const needAttention = active.filter((r) => r.signals.some((s) => s.level === 'bad')).length

  async function completeCoachTask(item: TodayItem) {
    setBusyTask(item.taskId)
    await fetch('/api/admin/coaching/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.taskId, status: 'done' }) })
    setBusyTask(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Heute */}
      <section className="card-static p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-primary font-semibold">Heute</div>
            <h2 className="text-lg font-bold text-foreground">Was du wann schicken musst</h2>
          </div>
          <span className="text-xs text-muted font-mono">{today.length} offen · {needAttention} Kunde{needAttention === 1 ? '' : 'n'} braucht dich</span>
        </div>
        {today.length === 0 ? (
          <p className="text-sm text-muted">Nichts fällig. Die Cadence-Aufgaben entstehen automatisch, wenn du eine Session mit Termin anlegst.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {today.map((t) => (
              <div key={t.taskId} className={`rounded-[var(--radius-lg)] border p-3 flex gap-3 items-start ${t.overdue ? 'border-danger/50 bg-danger/5' : 'border-border bg-background'}`}>
                <button type="button" onClick={() => completeCoachTask(t)} disabled={busyTask === t.taskId} className="mt-0.5 grid h-5 w-5 place-items-center rounded-md border-2 border-border hover:border-primary disabled:opacity-50" aria-label="Erledigt">
                  {busyTask === t.taskId ? <Loader2 size={11} className="animate-spin" /> : null}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-primary">
                    {t.dueAt ? `${relativeDays(t.dueAt)} · ${fmtDate(t.dueAt, 'datetime')}` : 'ohne Datum'} · <Link href={`/admin/coaching/${t.enrollmentId}`} className="hover:underline">{t.clientName}</Link>
                  </div>
                  <div className="text-sm text-foreground mt-0.5">{t.title}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Liste */}
      <section className="card-static overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">{active.length} aktiv</span>
            <span className="text-muted">·</span>
            <button type="button" onClick={() => setShowCompleted((v) => !v)} className="text-muted hover:text-foreground">
              {completed.length} abgeschlossen {showCompleted ? 'ausblenden' : 'anzeigen'}
            </button>
          </div>
          <button type="button" onClick={() => setCreating(true)} className="btn-primary !py-2 !px-3.5 !text-sm">
            <Plus size={15} /> Neue Teilnahme
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-[11px] font-mono uppercase tracking-[0.1em] text-muted bg-surface-secondary">
                <th className="px-5 py-2.5 font-medium">Kunde</th>
                <th className="px-3 py-2.5 font-medium">Status · Wo im Prozess</th>
                <th className="px-3 py-2.5 font-medium">Nächster Termin</th>
                <th className="px-3 py-2.5 font-medium">Aufgaben</th>
                <th className="px-3 py-2.5 font-medium">Letzter Kontakt</th>
                <th className="px-3 py-2.5 font-medium">Stimmung</th>
                <th className="px-3 py-2.5 font-medium">Signal</th>
              </tr>
            </thead>
            <tbody>
              {active.map((r) => <Row key={r.id} r={r} />)}
              {showCompleted && completed.map((r) => <Row key={r.id} r={r} />)}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-muted">Noch keine Teilnahmen. Leg die erste an.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!showCompleted && completed.length > 0 && (
          <div className="px-5 py-3 text-xs text-muted border-t border-border">
            {completed.length} abgeschlossene Teilnahme{completed.length === 1 ? '' : 'n'} eingeklappt ({completed.map((c) => c.clientName.split(' ')[0]).join(', ')}). Statistik zählt alle {rows.length}.
          </div>
        )}
      </section>

      {creating && <NewEnrollmentModal programs={programs} onClose={() => setCreating(false)} />}
    </div>
  )
}

function score(r: ListRow): number {
  let s = 0
  for (const sig of r.signals) s += sig.level === 'bad' ? 100 : sig.level === 'warn' ? 10 : sig.level === 'info' ? 2 : 1
  return s
}

function Row({ r }: { r: ListRow }) {
  const meta = ENROLLMENT_STATUS_META[r.status]
  return (
    <tr className={`border-t border-border hover:bg-surface-hover ${r.status === 'completed' ? 'opacity-70' : ''}`}>
      <td className="px-5 py-3 align-top">
        <Link href={`/admin/coaching/${r.id}`} className="font-semibold text-foreground hover:text-primary">{r.clientName}</Link>
        {r.company && <span className="text-muted"> · {r.company}</span>}
        <div className="mt-1 flex items-center gap-1.5">
          {r.goals.map((g, i) => <span key={i} className={`h-2 w-2 rounded-full ${GOAL_STATUS_META[g].dot}`} title={GOAL_STATUS_META[g].label} />)}
          <span className="text-[11px] font-mono text-muted ml-1">{r.progress} %</span>
        </div>
      </td>
      <td className="px-3 py-3 align-top">
        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-mono ${meta.badge}`}>{meta.label}</span>
        <div className="text-foreground mt-1">{r.phase}{r.coach ? <span className="text-muted"> · {r.coach}</span> : null}</div>
        {r.status === 'completed' && r.nps != null && <div className="text-[11px] font-mono text-muted">NPS {r.nps}</div>}
      </td>
      <td className="px-3 py-3 align-top font-mono text-[13px]">
        {r.nextAt ? <><div className="text-foreground">{fmtDate(r.nextAt, 'datetime')}</div><div className="text-muted text-[11px]">{r.nextTitle}</div></> : <span className={r.status === 'active' ? 'text-danger' : 'text-muted'}>{r.status === 'active' ? 'noch offen' : '–'}</span>}
      </td>
      <td className="px-3 py-3 align-top text-[13px]">
        <div className="text-foreground">{r.openTasks} offen</div>
        <div className={r.overdue ? 'text-danger' : 'text-muted'}>{r.overdue} überfällig</div>
      </td>
      <td className="px-3 py-3 align-top text-[13px]">
        {r.lastContact ? <><div className="text-foreground">{fmtDate(r.lastContact.at)}</div><div className="text-muted text-[11px]">{r.lastContact.label}</div></> : <span className="text-muted">–</span>}
      </td>
      <td className="px-3 py-3 align-top text-[13px]">
        {r.mood ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <i key={i} className={`block h-3.5 w-1.5 rounded-sm ${i <= r.mood!.score ? (r.mood!.score <= 2 ? 'bg-danger' : r.mood!.score === 3 ? 'bg-warning' : 'bg-success') : 'bg-border'}`} />)}</span>
            <span className="text-muted text-[11px] truncate max-w-[140px]" title={r.mood.note ?? ''}>{r.mood.score}{r.mood.note ? ` · ${r.mood.note}` : ''}</span>
          </div>
        ) : <span className="text-muted">–</span>}
      </td>
      <td className="px-3 py-3 align-top">
        <div className="flex flex-wrap gap-1">
          {r.signals.slice(0, 3).map((s, i) => <span key={i} className={`rounded-full px-2 py-0.5 text-[11px] font-mono whitespace-nowrap ${SIGNAL_CLASS[s.level]}`}>{s.label}</span>)}
          {r.signals.length === 0 && r.status === 'active' && <span className="rounded-full px-2 py-0.5 text-[11px] font-mono bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">läuft</span>}
        </div>
      </td>
    </tr>
  )
}

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
