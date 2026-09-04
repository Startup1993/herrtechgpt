'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Check, ChevronLeft, ExternalLink, Eye, Loader2, Mail, Plus, Trash2, Upload, X, Pencil, RefreshCw,
} from 'lucide-react'
import type { EnrollmentBundle } from '@/lib/coaching/queries'
import type { CoachingEvent, Enrollment, EventKind, Goal, Material, Milestone, Program, Task } from '@/lib/coaching/types'
import {
  COACH_OPTIONS, ENROLLMENT_STATUS_META, EVENT_KIND_META, GOAL_STATUS_META, MATERIAL_KIND_META, TRACK_OPTIONS, WORLD_MODE_META,
} from '@/lib/coaching/types'
import { computeProgress, derivePhase, deriveSignals, fmtDate, sortMilestones } from '@/lib/coaching/derive'
import { nextTemplateMilestone } from '@/lib/coaching/template'
import { Markdown } from '@/components/coaching/Markdown'

const input = 'w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground disabled:opacity-60'
const label = 'text-xs font-medium text-muted mb-1 block'

async function api<T = unknown>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Fehler')
  return json as T
}

async function uploadFile(enrollmentId: string, file: File): Promise<{ storage_path: string; file_name: string; signed_url: string | null }> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('enrollment_id', enrollmentId)
  const res = await fetch('/api/admin/coaching/upload', { method: 'POST', body: fd })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error ?? 'Upload fehlgeschlagen')
  return json
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EnrollmentEditor({ bundle, programs }: { bundle: EnrollmentBundle; programs: Program[] }) {
  const router = useRouter()
  const { enrollment, goals, materials, events } = bundle
  const milestones = useMemo(() => sortMilestones(bundle.milestones), [bundle.milestones])
  const progress = computeProgress(milestones, bundle.tasks)
  const phase = derivePhase(enrollment, milestones)
  const signals = deriveSignals(enrollment, milestones, bundle.tasks, events)
  const program = programs.find((p) => p.key === enrollment.program_key) ?? bundle.program
  const [tab, setTab] = useState<'overview' | 'sessions' | 'tasks' | 'material' | 'history'>('overview')
  const [inviting, setInviting] = useState(false)

  async function sendInvite() {
    if (!enrollment.client_email) { alert('Erst eine E-Mail-Adresse eintragen.'); return }
    if (!confirm(`Einladung „Dein Coaching-Zugang“ an ${enrollment.client_email} schicken?`)) return
    setInviting(true)
    try { await api('/api/admin/coaching/invite', 'POST', { enrollment_id: enrollment.id }); router.refresh() }
    catch (e) { alert((e as Error).message) }
    setInviting(false)
  }

  async function remove() {
    if (!confirm(`Teilnahme von ${enrollment.client_name} komplett löschen? Sessions, Aufgaben, Material und Verlauf gehen mit.`)) return
    await api(`/api/admin/coaching/enrollments?id=${enrollment.id}`, 'DELETE')
    router.push('/admin/coaching'); router.refresh()
  }

  const statusMeta = ENROLLMENT_STATUS_META[enrollment.status]

  return (
    <div className="p-6 sm:p-8 max-w-6xl">
      <Link href="/admin/coaching" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4"><ChevronLeft size={15} /> Alle Kunden</Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{enrollment.client_name}</h1>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-mono ${statusMeta.badge}`}>{statusMeta.label}</span>
            <span className="text-sm text-muted">{phase.short}{enrollment.coach_name ? ` · ${enrollment.coach_name}` : ''}</span>
          </div>
          <div className="text-sm text-muted mt-1">
            {[enrollment.company, enrollment.client_email, program?.title, `${progress.percent} % Fortschritt`].filter(Boolean).join(' · ')}
          </div>
          {signals.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {signals.map((s, i) => <span key={i} className={`rounded-full px-2 py-0.5 text-[11px] font-mono ${s.level === 'bad' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' : s.level === 'warn' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' : s.level === 'ok' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-primary/10 text-primary'}`}>{s.label}</span>)}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/coaching/${enrollment.id}/preview`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"><Eye size={15} /> Kundenansicht</Link>
          <button type="button" onClick={sendInvite} disabled={inviting} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50">
            {inviting ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} {enrollment.invited_at ? 'Einladung erneut senden' : 'Einladung senden'}
          </button>
          {enrollment.notion_url && <a href={enrollment.notion_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground hover:bg-surface-hover"><ExternalLink size={14} /> Notion</a>}
          {enrollment.drive_url && <a href={enrollment.drive_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground hover:bg-surface-hover"><ExternalLink size={14} /> Drive</a>}
        </div>
      </div>

      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {([
          ['overview', 'Stammdaten & Workflows'],
          ['sessions', `Sessions (${milestones.length})`],
          ['tasks', `Aufgaben (${bundle.tasks.filter((t) => t.status === 'open').length} offen)`],
          ['material', `Material (${materials.length})`],
          ['history', `Verlauf (${events.length})`],
        ] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`px-3.5 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px ${tab === k ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted hover:text-foreground'}`}>{l}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-6 items-start">
          <StammdatenForm enrollment={enrollment} programs={programs} />
          <div className="space-y-6">
            <GoalsSection enrollment={enrollment} goals={goals} milestones={milestones} />
            <div className="card-static p-5">
              <h3 className="text-sm font-semibold text-foreground mb-2">Gefahrenzone</h3>
              <p className="text-xs text-muted mb-3">Löscht die Teilnahme mit allem, was dazugehört. Der World-Account des Kunden bleibt.</p>
              <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10"><Trash2 size={13} /> Teilnahme löschen</button>
            </div>
          </div>
        </div>
      )}
      {tab === 'sessions' && <MilestonesSection enrollment={enrollment} milestones={milestones} tasks={bundle.tasks} materials={materials} program={program ?? null} />}
      {tab === 'tasks' && <TasksSection enrollment={enrollment} tasks={bundle.tasks} milestones={milestones} />}
      {tab === 'material' && <MaterialsSection enrollment={enrollment} materials={materials} milestones={milestones} />}
      {tab === 'history' && <HistorySection enrollment={enrollment} events={events} />}
    </div>
  )
}

// ─── Stammdaten ───────────────────────────────────────────────────────────────

function StammdatenForm({ enrollment, programs }: { enrollment: Enrollment; programs: Program[] }) {
  const router = useRouter()
  const [form, setForm] = useState({ ...enrollment })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/api/admin/coaching/enrollments', 'PATCH', {
        id: enrollment.id,
        client_name: form.client_name, client_email: form.client_email, company: form.company, coach_name: form.coach_name,
        status: form.status, world_mode: form.world_mode, program_key: form.program_key, starts_at: form.starts_at, ends_at: form.ends_at,
        track: form.track, persona: form.persona, north_star: form.north_star, success_quote: form.success_quote, intro_text: form.intro_text,
        nps: form.nps, upsell_status: form.upsell_status, case_study: form.case_study,
        notion_url: form.notion_url, drive_url: form.drive_url, whatsapp_url: form.whatsapp_url, community_url: form.community_url,
        recommendation_title: form.recommendation_title, recommendation_text: form.recommendation_text,
        recommendation_url: form.recommendation_url, recommendation_cta: form.recommendation_cta,
      })
      setSaved(true); setTimeout(() => setSaved(false), 1500); router.refresh()
    } catch (err) { alert((err as Error).message) }
    setSaving(false)
  }

  const set = (k: keyof Enrollment) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value })

  return (
    <form onSubmit={save} className="card-static p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Stammdaten</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <label><span className={label}>Name</span><input className={input} value={form.client_name} onChange={set('client_name')} required /></label>
        <label><span className={label}>E-Mail</span><input className={input} type="email" value={form.client_email ?? ''} onChange={set('client_email')} /></label>
        <label><span className={label}>Firma</span><input className={input} value={form.company ?? ''} onChange={set('company')} /></label>
        <label><span className={label}>Coach</span><select className={input} value={form.coach_name ?? ''} onChange={set('coach_name')}><option value="">–</option>{COACH_OPTIONS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label><span className={label}>Status</span><select className={input} value={form.status} onChange={set('status')}><option value="active">aktiv</option><option value="paused">pausiert</option><option value="completed">abgeschlossen</option></select></label>
        <label><span className={label}>World-Zugang</span><select className={input} value={form.world_mode} onChange={set('world_mode')}>{(Object.keys(WORLD_MODE_META) as Array<keyof typeof WORLD_MODE_META>).map((k) => <option key={k} value={k}>{WORLD_MODE_META[k].label}</option>)}</select></label>
        <label><span className={label}>Programm</span><select className={input} value={form.program_key} onChange={set('program_key')}>{programs.map((p) => <option key={p.key} value={p.key}>{p.title}</option>)}</select></label>
        <label><span className={label}>Track</span><select className={input} value={form.track ?? ''} onChange={set('track')}><option value="">offen</option>{TRACK_OPTIONS.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label><span className={label}>Start</span><input className={input} type="date" value={form.starts_at ?? ''} onChange={set('starts_at')} /></label>
        <label><span className={label}>Community bis</span><input className={input} type="date" value={form.ends_at ?? ''} onChange={set('ends_at')} /></label>
      </div>
      <p className="text-xs text-muted -mt-1">{WORLD_MODE_META[form.world_mode].hint} Das Flag gewinnt gegen das Tier.</p>
      <label className="block"><span className={label}>Nordstern (ein Satz)</span><input className={input} value={form.north_star ?? ''} onChange={set('north_star')} /></label>
      <label className="block"><span className={label}>Erfolgs-Zitat (wörtlich)</span><input className={input} value={form.success_quote ?? ''} onChange={set('success_quote')} /></label>
      <label className="block"><span className={label}>Intro-Text im Dashboard (leer = automatisch aus Termin und Aufgaben)</span><textarea className={input} rows={2} value={form.intro_text ?? ''} onChange={set('intro_text')} placeholder="Call 3 ist am Dienstag. Bis dahin: zwei Reels raus." /></label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label><span className={label}>Persona</span><input className={input} value={form.persona ?? ''} onChange={set('persona')} placeholder="Content mit Lost-Einschlag" /></label>
        <label><span className={label}>WhatsApp-Link (wa.me)</span><input className={input} value={form.whatsapp_url ?? ''} onChange={set('whatsapp_url')} placeholder="https://wa.me/49…" /></label>
        <label><span className={label}>Notion-Kundenseite</span><input className={input} value={form.notion_url ?? ''} onChange={set('notion_url')} /></label>
        <label><span className={label}>Drive-Kundenordner</span><input className={input} value={form.drive_url ?? ''} onChange={set('drive_url')} /></label>
        <label><span className={label}>Community-Link (leer = Standard)</span><input className={input} value={form.community_url ?? ''} onChange={set('community_url')} /></label>
        <label><span className={label}>Upsell-Status</span><input className={input} value={form.upsell_status ?? ''} onChange={set('upsell_status')} placeholder="Club / Sprint / Power Session / offen" /></label>
        <label><span className={label}>NPS (0 bis 10)</span><input className={input} type="number" min={0} max={10} value={form.nps ?? ''} onChange={(e) => setForm({ ...form, nps: e.target.value === '' ? null : Number(e.target.value) })} /></label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-foreground"><input type="checkbox" checked={form.case_study} onChange={(e) => setForm({ ...form, case_study: e.target.checked })} /> Case Study</label>
      </div>
      <div className="rounded-lg border border-border p-3 space-y-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Empfehlungskarte (Alumni-Übergang)</div>
          <p className="text-xs text-muted">Erscheint im Dashboard des Kunden als Karte, z. B. nach Call 4: Club-Live-Calls, Sprint, Power Session. Leer lassen = keine Karte.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label><span className={label}>Titel</span><input className={input} value={form.recommendation_title ?? ''} onChange={set('recommendation_title')} placeholder="Nächster Schritt: KI Sprint" /></label>
          <label><span className={label}>Button-Text</span><input className={input} value={form.recommendation_cta ?? ''} onChange={set('recommendation_cta')} placeholder="Mehr erfahren" /></label>
        </div>
        <label className="block"><span className={label}>Text</span><textarea className={input} rows={2} value={form.recommendation_text ?? ''} onChange={set('recommendation_text')} placeholder="Du weißt jetzt, wie Claude tickt. Im Sprint bauen wir dein großes Ding in 2 bis 4 Wochen fertig." /></label>
        <label className="block"><span className={label}>Link</span><input className={input} value={form.recommendation_url ?? ''} onChange={set('recommendation_url')} placeholder="https://herr.tech/sprint" /></label>
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" onClick={() => setForm({ ...form, world_mode: 'full', status: 'completed' })} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-surface-hover">Alumni-Modus vorbereiten (World öffnen, Status abgeschlossen)</button>
          <span className="text-[11px] text-muted self-center">Wirkt erst nach „Speichern“.</span>
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted">{enrollment.profile_id ? `World-Account verknüpft · zuletzt gesehen ${enrollment.last_client_seen_at ? fmtDate(enrollment.last_client_seen_at, 'datetime') : 'nie'}` : 'kein World-Account (Einladung legt ihn an)'}</span>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} {saved ? 'Gespeichert' : 'Speichern'}</button>
      </div>
    </form>
  )
}

// ─── Workflows ────────────────────────────────────────────────────────────────

function GoalsSection({ enrollment, goals, milestones }: { enrollment: Enrollment; goals: Goal[]; milestones: Milestone[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Partial<Goal> | null>(null)

  async function save(g: Partial<Goal>) {
    try {
      if (g.id) await api('/api/admin/coaching/goals', 'PATCH', g)
      else await api('/api/admin/coaching/goals', 'POST', { ...g, enrollment_id: enrollment.id })
      setEditing(null); router.refresh()
    } catch (e) { alert((e as Error).message) }
  }
  async function quickStatus(g: Goal, status: Goal['status']) {
    await api('/api/admin/coaching/goals', 'PATCH', { id: g.id, status }); router.refresh()
  }
  async function remove(g: Goal) {
    if (!confirm(`Workflow „${g.title}“ löschen?`)) return
    await api(`/api/admin/coaching/goals?id=${g.id}`, 'DELETE'); router.refresh()
  }

  return (
    <div className="card-static p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Die 3 Workflows (Ampel)</h3>
        <button type="button" onClick={() => setEditing({ status: 'planned' })} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"><Plus size={13} /> Workflow</button>
      </div>
      {goals.length === 0 && <p className="text-sm text-muted">Noch keine Workflows. Kommen aus dem Kickoff.</p>}
      <div className="space-y-2">
        {goals.map((g) => (
          <div key={g.id} className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className={`mt-1.5 h-3 w-3 rounded-full shrink-0 ${GOAL_STATUS_META[g.status].dot}`} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">{g.title}</div>
                  {(g.status_note || g.description) && <div className="text-xs text-muted mt-0.5">{g.status_note || g.description}</div>}
                  {g.milestone_id && <div className="text-[11px] font-mono text-muted mt-0.5">gebaut in {milestones.find((m) => m.id === g.milestone_id)?.title ?? '?'}</div>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button type="button" onClick={() => setEditing(g)} className="p-1.5 text-muted hover:text-foreground" aria-label="Bearbeiten"><Pencil size={14} /></button>
                <button type="button" onClick={() => remove(g)} className="p-1.5 text-muted hover:text-danger" aria-label="Löschen"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {(Object.keys(GOAL_STATUS_META) as Goal['status'][]).map((s) => (
                <button key={s} type="button" onClick={() => quickStatus(g, s)} className={`rounded-full px-2 py-0.5 text-[11px] font-mono border ${g.status === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:text-foreground'}`}>{GOAL_STATUS_META[s].label}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted mt-3">Der Kunde sieht die Ampel: grau geplant, gelb in Arbeit, grün läuft bei ihm, rot hängt. Grün erst, wenn es beim Kunden im Alltag läuft.</p>

      {editing && (
        <Modal title={editing.id ? 'Workflow bearbeiten' : 'Neuer Workflow'} onClose={() => setEditing(null)}>
          <GoalForm goal={editing} milestones={milestones} onSave={save} />
        </Modal>
      )}
    </div>
  )
}

function GoalForm({ goal, milestones, onSave }: { goal: Partial<Goal>; milestones: Milestone[]; onSave: (g: Partial<Goal>) => Promise<void> }) {
  const [form, setForm] = useState<Partial<Goal>>({ title: '', description: '', status_note: '', baseline: '', result: '', ...goal })
  const [saving, setSaving] = useState(false)
  return (
    <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false) }} className="space-y-3">
      <label className="block"><span className={label}>Titel</span><input className={input} required value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brand Voice und Steinbruch" /></label>
      <label className="block"><span className={label}>Was löst der Workflow (für den Kunden sichtbar)</span><textarea className={input} rows={2} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label><span className={label}>Status</span><select className={input} value={form.status ?? 'planned'} onChange={(e) => setForm({ ...form, status: e.target.value as Goal['status'] })}>{(Object.keys(GOAL_STATUS_META) as Goal['status'][]).map((s) => <option key={s} value={s}>{GOAL_STATUS_META[s].label}</option>)}</select></label>
        <label><span className={label}>Gebaut in</span><select className={input} value={form.milestone_id ?? ''} onChange={(e) => setForm({ ...form, milestone_id: e.target.value || null })}><option value="">–</option>{milestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select></label>
      </div>
      <label className="block"><span className={label}>Status-Notiz (ein Satz, sieht der Kunde)</span><input className={input} value={form.status_note ?? ''} onChange={(e) => setForm({ ...form, status_note: e.target.value })} placeholder="Skill steht, liefert bei dir noch zu schwach. Fix ist Call 3." /></label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label><span className={label}>Baseline (intern)</span><input className={input} value={form.baseline ?? ''} onChange={(e) => setForm({ ...form, baseline: e.target.value })} /></label>
        <label><span className={label}>Ergebnis (intern)</span><input className={input} value={form.result ?? ''} onChange={(e) => setForm({ ...form, result: e.target.value })} /></label>
      </div>
      <div className="flex justify-end"><button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Speichern</button></div>
    </form>
  )
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

function MilestonesSection({ enrollment, milestones, tasks, materials, program }: { enrollment: Enrollment; milestones: Milestone[]; tasks: Task[]; materials: Material[]; program: Program | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Partial<Milestone> | null>(null)
  const [busy, setBusy] = useState(false)
  const suggestion = nextTemplateMilestone(program, milestones)

  async function addFromTemplate() {
    if (!suggestion) return
    setBusy(true)
    try {
      const created = await api<Milestone>('/api/admin/coaching/milestones', 'POST', { enrollment_id: enrollment.id, kind: suggestion.kind, number: suggestion.number, title: suggestion.title, goal: suggestion.goal, with_cadence: true })
      router.refresh()
      setEditing(created)
    } catch (e) { alert((e as Error).message) }
    setBusy(false)
  }
  async function save(m: Partial<Milestone> & { change_reason?: string }) {
    try {
      if (m.id) await api('/api/admin/coaching/milestones', 'PATCH', m)
      else await api('/api/admin/coaching/milestones', 'POST', { ...m, enrollment_id: enrollment.id })
      setEditing(null); router.refresh()
    } catch (e) { alert((e as Error).message) }
  }
  async function remove(m: Milestone) {
    if (!confirm(`„${m.title}“ löschen? Zugeordnete Aufgaben bleiben, verlieren aber die Zuordnung.`)) return
    await api(`/api/admin/coaching/milestones?id=${m.id}`, 'DELETE'); router.refresh()
  }
  async function markDone(m: Milestone) {
    await api('/api/admin/coaching/milestones', 'PATCH', { id: m.id, status: 'done' }); router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Kickoff, Calls und Check-ins. „Neue Session“ nimmt den nächsten Punkt aus der Programm-Vorlage und legt die Coach-Erinnerungen dazu an, sobald ein Termin steht. Was nach Call 4 kommt, entsteht pro Kunde aus den Calls (Plugin-Command /weiterfuehrung), nicht aus einer Vorlage.</p>
        <div className="flex gap-2">
          {suggestion && <button type="button" onClick={addFromTemplate} disabled={busy} className="btn-primary !py-2 !px-3.5 !text-sm">{busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {suggestion.title} anlegen</button>}
          <button type="button" onClick={() => setEditing({ kind: 'call', number: (milestones.filter((m) => m.kind === 'call').length || 0) + 1, status: 'planned' })} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground hover:bg-surface-hover"><Plus size={15} /> Frei anlegen</button>
        </div>
      </div>
      {milestones.length === 0 && <div className="card-static p-8 text-center text-sm text-muted">Noch keine Sessions.</div>}
      {milestones.map((m) => {
        const mTasks = tasks.filter((t) => t.milestone_id === m.id)
        const mMats = materials.filter((x) => x.milestone_id === m.id)
        return (
          <div key={m.id} className={`card-static p-5 ${m.status === 'cancelled' ? 'opacity-60' : ''}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">{m.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-mono ${m.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' : m.status === 'scheduled' ? 'bg-primary/10 text-primary' : m.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' : 'bg-surface-secondary text-muted'}`}>
                    {m.status === 'done' ? 'abgeschlossen' : m.status === 'scheduled' ? 'terminiert' : m.status === 'cancelled' ? 'entfällt' : 'geplant'}
                  </span>
                  <span className="text-xs font-mono text-muted">{m.scheduled_at ? fmtDate(m.scheduled_at, 'datetime') : 'kein Termin'}</span>
                </div>
                {m.goal && <p className="text-sm text-muted mt-1">{m.goal}</p>}
                <div className="text-[11px] font-mono text-muted mt-1">
                  {mTasks.filter((t) => t.assignee === 'client').length} Kunden-Aufgaben · {mTasks.filter((t) => t.assignee === 'coach').length} Coach-Aufgaben · {mMats.length} Material
                  {m.summary ? ' · Zusammenfassung da' : ' · keine Zusammenfassung'}
                  {m.recap_url ? ' · Recap-PDF' : ''}{m.recording_url ? ' · Aufzeichnung' : ''}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {m.status !== 'done' && m.status !== 'cancelled' && <button type="button" onClick={() => markDone(m)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-surface-hover"><Check size={13} /> Abschließen</button>}
                <button type="button" onClick={() => setEditing(m)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-surface-hover"><Pencil size={13} /> Bearbeiten</button>
                <button type="button" onClick={() => remove(m)} className="p-1.5 text-muted hover:text-danger" aria-label="Löschen"><Trash2 size={14} /></button>
              </div>
            </div>
            {m.summary && <div className="mt-3 rounded-lg border border-border bg-background p-3 max-h-40 overflow-y-auto"><Markdown text={m.summary} /></div>}
          </div>
        )
      })}
      {editing && (
        <Modal title={editing.id ? `${editing.title} bearbeiten` : 'Neue Session'} onClose={() => setEditing(null)} wide>
          <MilestoneForm enrollment={enrollment} milestone={editing} onSave={save} />
        </Modal>
      )}
    </div>
  )
}

function MilestoneForm({ enrollment, milestone, onSave }: { enrollment: Enrollment; milestone: Partial<Milestone>; onSave: (m: Partial<Milestone> & { change_reason?: string }) => Promise<void> }) {
  const [form, setForm] = useState<Partial<Milestone>>({ title: '', goal: '', success_criterion: '', summary: '', decisions: '', done_items: '', open_items: '', bring_along: '', recording_url: '', recap_url: '', meeting_url: '', ...milestone })
  const [scheduled, setScheduled] = useState(toLocalInput(milestone.scheduled_at))
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const dateChanged = toLocalInput(milestone.scheduled_at) !== scheduled && !!milestone.id

  async function onRecap(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    setUploading(true)
    try { const r = await uploadFile(enrollment.id, f); setForm({ ...form, recap_storage_path: r.storage_path, recap_url: r.signed_url ?? form.recap_url }) }
    catch (err) { alert((err as Error).message) }
    setUploading(false)
  }

  return (
    <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); await onSave({ ...form, scheduled_at: scheduled ? new Date(scheduled).toISOString() : null, change_reason: reason }); setSaving(false) }} className="space-y-3">
      <div className="grid sm:grid-cols-[1fr_120px_120px] gap-3">
        <label><span className={label}>Titel</span><input className={input} required value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Call 3 · Claude-Setup bei dir" /></label>
        <label><span className={label}>Typ</span><select className={input} value={form.kind ?? 'call'} onChange={(e) => setForm({ ...form, kind: e.target.value as Milestone['kind'] })}><option value="kickoff">Kickoff</option><option value="call">Call</option><option value="checkin">Check-in</option><option value="month">Monat</option></select></label>
        <label><span className={label}>Nummer</span><input className={input} type="number" value={form.number ?? 1} onChange={(e) => setForm({ ...form, number: Number(e.target.value) })} /></label>
      </div>
      <div className="grid sm:grid-cols-[1fr_1fr_140px] gap-3">
        <label><span className={label}>Termin</span><input className={input} type="datetime-local" value={scheduled} onChange={(e) => setScheduled(e.target.value)} /></label>
        <label><span className={label}>Meeting-Link</span><input className={input} value={form.meeting_url ?? ''} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} placeholder="https://meet.google.com/…" /></label>
        <label><span className={label}>Status</span><select className={input} value={form.status ?? 'planned'} onChange={(e) => setForm({ ...form, status: e.target.value as Milestone['status'] })}><option value="planned">geplant</option><option value="scheduled">terminiert</option><option value="done">abgeschlossen</option><option value="cancelled">entfällt</option></select></label>
      </div>
      {dateChanged && <label className="block"><span className={label}>Grund der Verschiebung (sieht der Kunde im Zeitstrahl)</span><input className={input} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Buchphase, Kunde bis 07.09. nicht erreichbar" /></label>}
      <label className="block"><span className={label}>Ziel (ein Satz, sieht der Kunde)</span><input className={input} value={form.goal ?? ''} onChange={(e) => setForm({ ...form, goal: e.target.value })} /></label>
      <label className="block"><span className={label}>Bring mit (für den nächsten Call)</span><input className={input} value={form.bring_along ?? ''} onChange={(e) => setForm({ ...form, bring_along: e.target.value })} placeholder="Buch-PDF, 10 stärkste LinkedIn-Posts, die zwei Reels" /></label>
      <label className="block"><span className={label}>Erfolgskriterium (intern)</span><input className={input} value={form.success_criterion ?? ''} onChange={(e) => setForm({ ...form, success_criterion: e.target.value })} /></label>
      <label className="block"><span className={label}>Was wir gemacht haben (Markdown, sieht der Kunde)</span><textarea className={`${input} font-mono text-xs`} rows={8} value={form.summary ?? ''} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder={'- **Polaritäts-Check:** Köster oder Onaran …\n- **Drei Säulen fixiert:** …'} /></label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label><span className={label}>Erledigt (Markdown)</span><textarea className={`${input} font-mono text-xs`} rows={5} value={form.done_items ?? ''} onChange={(e) => setForm({ ...form, done_items: e.target.value })} /></label>
        <label><span className={label}>Offen (Markdown)</span><textarea className={`${input} font-mono text-xs`} rows={5} value={form.open_items ?? ''} onChange={(e) => setForm({ ...form, open_items: e.target.value })} /></label>
      </div>
      <label className="block"><span className={label}>Entscheidungen, die jetzt gelten (Markdown)</span><textarea className={`${input} font-mono text-xs`} rows={4} value={form.decisions ?? ''} onChange={(e) => setForm({ ...form, decisions: e.target.value })} /></label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label><span className={label}>Aufzeichnung (Link, z. B. Drive)</span><input className={input} value={form.recording_url ?? ''} onChange={(e) => setForm({ ...form, recording_url: e.target.value })} /></label>
        <div>
          <span className={label}>Recap-PDF</span>
          <div className="flex items-center gap-2">
            <input className={input} value={form.recap_storage_path ? `Datei: ${form.recap_storage_path.split('/').pop()}` : (form.recap_url ?? '')} onChange={(e) => setForm({ ...form, recap_url: e.target.value, recap_storage_path: null })} placeholder="Link oder Datei hochladen" disabled={!!form.recap_storage_path} />
            <label className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-2 text-xs text-foreground hover:bg-surface-hover cursor-pointer whitespace-nowrap">
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} {form.recap_storage_path ? 'Tauschen' : 'Upload'}
              <input type="file" accept="application/pdf" className="hidden" onChange={onRecap} />
            </label>
            {form.recap_storage_path && <button type="button" onClick={() => setForm({ ...form, recap_storage_path: null, recap_url: '' })} className="p-1.5 text-muted hover:text-danger" aria-label="Datei entfernen"><X size={14} /></button>}
          </div>
        </div>
      </div>
      <div className="flex justify-end"><button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Speichern</button></div>
    </form>
  )
}

// ─── Aufgaben ─────────────────────────────────────────────────────────────────

function TasksSection({ enrollment, tasks, milestones }: { enrollment: Enrollment; tasks: Task[]; milestones: Milestone[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Partial<Task> | null>(null)
  const [showDone, setShowDone] = useState(false)
  const [scope, setScope] = useState<'client' | 'coach'>('client')
  const [now] = useState(() => Date.now())

  const list = tasks.filter((t) => t.assignee === scope && (showDone || t.status === 'open')).sort((a, b) => (a.due_at ? new Date(a.due_at).getTime() : Infinity) - (b.due_at ? new Date(b.due_at).getTime() : Infinity))

  async function save(t: Partial<Task>) {
    try {
      if (t.id) await api('/api/admin/coaching/tasks', 'PATCH', t)
      else await api('/api/admin/coaching/tasks', 'POST', { ...t, enrollment_id: enrollment.id })
      setEditing(null); router.refresh()
    } catch (e) { alert((e as Error).message) }
  }
  async function toggle(t: Task) { await api('/api/admin/coaching/tasks', 'PATCH', { id: t.id, status: t.status === 'done' ? 'open' : 'done' }); router.refresh() }
  async function skip(t: Task) { await api('/api/admin/coaching/tasks', 'PATCH', { id: t.id, status: 'skipped' }); router.refresh() }
  async function remove(t: Task) { if (!confirm(`„${t.title}“ löschen?`)) return; await api(`/api/admin/coaching/tasks?id=${t.id}`, 'DELETE'); router.refresh() }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          {(['client', 'coach'] as const).map((s) => <button key={s} type="button" onClick={() => setScope(s)} className={`rounded-md px-3 py-1.5 text-sm ${scope === s ? 'bg-primary text-white font-semibold' : 'text-muted hover:text-foreground'}`}>{s === 'client' ? `Kunde (${tasks.filter((t) => t.assignee === 'client' && t.status === 'open').length})` : `Coach (${tasks.filter((t) => t.assignee === 'coach' && t.status === 'open').length})`}</button>)}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-muted flex items-center gap-1.5"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> erledigte zeigen</label>
          <button type="button" onClick={() => setEditing({ assignee: scope, kind: scope === 'client' ? 'homework' : 'promise', status: 'open' })} className="btn-primary !py-2 !px-3.5 !text-sm"><Plus size={15} /> Aufgabe</button>
        </div>
      </div>
      <p className="text-sm text-muted">{scope === 'client' ? 'Hausaufgaben des Kunden. Anleitung und Copy-Prompt erscheinen im Dashboard hinter dem Button „Anleitung“.' : 'Deine Zusagen und die Cadence-Erinnerungen. Sieht der Kunde nie. Erscheinen in der Heute-Liste des Cockpits.'}</p>
      {list.length === 0 && <div className="card-static p-8 text-center text-sm text-muted">Nichts offen.</div>}
      <div className="space-y-2">
        {list.map((t) => {
          const overdue = t.status === 'open' && t.due_at && new Date(t.due_at).getTime() < now
          return (
            <div key={t.id} className={`card-static p-4 flex items-start gap-3 ${t.status !== 'open' ? 'opacity-60' : ''}`}>
              <button type="button" onClick={() => toggle(t)} className={`mt-0.5 grid h-5 w-5 place-items-center rounded-md border-2 ${t.status === 'done' ? 'bg-primary border-primary text-white' : 'border-border hover:border-primary'}`} aria-label="Umschalten">{t.status === 'done' && <Check size={12} strokeWidth={3} />}</button>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-semibold ${t.status === 'done' ? 'line-through text-muted' : 'text-foreground'}`}>{t.title}</div>
                <div className="text-[11px] font-mono text-muted mt-0.5">
                  {t.due_at ? <span className={overdue ? 'text-danger' : ''}>bis {fmtDate(t.due_at, 'datetime')}</span> : 'ohne Datum'}
                  {t.milestone_id && ` · ${milestones.find((m) => m.id === t.milestone_id)?.title ?? ''}`}
                  {` · ${t.kind}`}{t.status === 'skipped' ? ' · gestrichen' : ''}{t.completed_at ? ` · erledigt ${fmtDate(t.completed_at)}` : ''}
                </div>
                {t.description && <div className="text-xs text-muted mt-1">{t.description}</div>}
                {(t.instructions || t.copy_prompt) && <div className="text-[11px] text-primary mt-1">{t.instructions ? 'Anleitung' : ''}{t.instructions && t.copy_prompt ? ' + ' : ''}{t.copy_prompt ? 'Copy-Prompt' : ''} hinterlegt</div>}
              </div>
              <div className="flex gap-1 shrink-0">
                {t.status === 'open' && <button type="button" onClick={() => skip(t)} className="p-1.5 text-muted hover:text-foreground text-xs" title="Streichen">streichen</button>}
                <button type="button" onClick={() => setEditing(t)} className="p-1.5 text-muted hover:text-foreground" aria-label="Bearbeiten"><Pencil size={14} /></button>
                <button type="button" onClick={() => remove(t)} className="p-1.5 text-muted hover:text-danger" aria-label="Löschen"><Trash2 size={14} /></button>
              </div>
            </div>
          )
        })}
      </div>
      {editing && (
        <Modal title={editing.id ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'} onClose={() => setEditing(null)} wide>
          <TaskForm task={editing} milestones={milestones} onSave={save} />
        </Modal>
      )}
    </div>
  )
}

function TaskForm({ task, milestones, onSave }: { task: Partial<Task>; milestones: Milestone[]; onSave: (t: Partial<Task>) => Promise<void> }) {
  const [form, setForm] = useState<Partial<Task>>({ title: '', description: '', instructions: '', copy_prompt: '', link_url: '', ...task })
  const [due, setDue] = useState(toLocalInput(task.due_at))
  const [saving, setSaving] = useState(false)
  return (
    <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); await onSave({ ...form, due_at: due ? new Date(due).toISOString() : null }); setSaving(false) }} className="space-y-3">
      <label className="block"><span className={label}>Titel</span><input className={input} required value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Reel 1 und Reel 2 aufnehmen und posten" /></label>
      <label className="block"><span className={label}>Kurzbeschreibung (eine Zeile unter dem Titel)</span><input className={input} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Teleprompter-App, ein Take, Untertitel mit Captions." /></label>
      <div className="grid sm:grid-cols-4 gap-3">
        <label><span className={label}>Für</span><select className={input} value={form.assignee ?? 'client'} onChange={(e) => setForm({ ...form, assignee: e.target.value as Task['assignee'] })}><option value="client">Kunde</option><option value="coach">Coach</option></select></label>
        <label><span className={label}>Art</span><select className={input} value={form.kind ?? 'homework'} onChange={(e) => setForm({ ...form, kind: e.target.value as Task['kind'] })}><option value="homework">Hausaufgabe</option><option value="promise">Zusage</option><option value="cadence">Cadence</option></select></label>
        <label><span className={label}>Fällig</span><input className={input} type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} /></label>
        <label><span className={label}>Session</span><select className={input} value={form.milestone_id ?? ''} onChange={(e) => setForm({ ...form, milestone_id: e.target.value || null })}><option value="">–</option>{milestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select></label>
      </div>
      <label className="block"><span className={label}>Anleitung (Markdown, Anfänger-tauglich, sieht der Kunde hinter „Anleitung“)</span><textarea className={`${input} font-mono text-xs`} rows={7} value={form.instructions ?? ''} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder={'1. claude.ai öffnen und einloggen\n2. Unten links auf deine Initialen, dann **Einstellungen** …'} /></label>
      <label className="block"><span className={label}>Copy-Prompt für Claude (Kunde kopiert mit einem Klick)</span><textarea className={`${input} font-mono text-xs`} rows={4} value={form.copy_prompt ?? ''} onChange={(e) => setForm({ ...form, copy_prompt: e.target.value })} placeholder="Erklär mir Schritt für Schritt, ich bin Anfänger, ich schicke dir Screenshots, wenn ich etwas nicht finde: …" /></label>
      <label className="block"><span className={label}>Link (Skript, Datei, Tool)</span><input className={input} value={form.link_url ?? ''} onChange={(e) => setForm({ ...form, link_url: e.target.value })} /></label>
      <div className="flex justify-end"><button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Speichern</button></div>
    </form>
  )
}

// ─── Material ─────────────────────────────────────────────────────────────────

function MaterialsSection({ enrollment, materials, milestones }: { enrollment: Enrollment; materials: Material[]; milestones: Milestone[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Partial<Material> | null>(null)

  async function save(m: Partial<Material>) {
    try {
      if (m.id) await api('/api/admin/coaching/materials', 'PATCH', m)
      else await api('/api/admin/coaching/materials', 'POST', { ...m, enrollment_id: enrollment.id })
      setEditing(null); router.refresh()
    } catch (e) { alert((e as Error).message) }
  }
  async function toggleVisibility(m: Material) { await api('/api/admin/coaching/materials', 'PATCH', { id: m.id, visibility: m.visibility === 'client' ? 'internal' : 'client' }); router.refresh() }
  async function remove(m: Material) { if (!confirm(`„${m.title}“ löschen? Die Datei im Speicher geht mit.`)) return; await api(`/api/admin/coaching/materials?id=${m.id}`, 'DELETE'); router.refresh() }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted max-w-2xl">Skills, Skripte, Analysen, PDFs. Neues Material ist erst intern. Freigeben, dann sieht es der Kunde mit „neu“-Markierung. Dateien kannst du hier jederzeit tauschen.</p>
        <button type="button" onClick={() => setEditing({ kind: 'document', visibility: 'internal' })} className="btn-primary !py-2 !px-3.5 !text-sm"><Plus size={15} /> Material</button>
      </div>
      {materials.length === 0 && <div className="card-static p-8 text-center text-sm text-muted">Noch kein Material.</div>}
      <div className="space-y-2">
        {materials.map((m) => (
          <div key={m.id} className="card-static p-4 flex items-start gap-3">
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border text-[10px] font-mono font-bold ${m.kind === 'skill' ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border bg-surface-secondary text-muted'}`}>{MATERIAL_KIND_META[m.kind].short}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{m.title}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-mono ${m.visibility === 'client' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-surface-secondary text-muted'}`}>{m.visibility === 'client' ? (m.first_opened_at ? 'freigegeben · geöffnet' : 'freigegeben · neu') : 'intern'}</span>
              </div>
              <div className="text-[11px] font-mono text-muted mt-0.5">{[MATERIAL_KIND_META[m.kind].label, m.version, fmtDate(m.created_at), m.file_name ?? (m.external_url ? 'Link' : 'ohne Datei'), m.milestone_id ? milestones.find((x) => x.id === m.milestone_id)?.title : null].filter(Boolean).join(' · ')}</div>
              {m.description && <div className="text-xs text-muted mt-1">{m.description}</div>}
            </div>
            <div className="flex gap-1 shrink-0 items-center">
              {(m.signed_url || m.external_url) && <a href={m.signed_url ?? m.external_url ?? '#'} target="_blank" rel="noreferrer" className="p-1.5 text-muted hover:text-foreground" aria-label="Öffnen"><ExternalLink size={14} /></a>}
              <button type="button" onClick={() => toggleVisibility(m)} className={`rounded-lg border px-2.5 py-1.5 text-xs ${m.visibility === 'client' ? 'border-border text-muted hover:text-foreground' : 'border-primary text-primary hover:bg-primary/10'}`}>{m.visibility === 'client' ? 'Zurückziehen' : 'Freigeben'}</button>
              <button type="button" onClick={() => setEditing(m)} className="p-1.5 text-muted hover:text-foreground" aria-label="Bearbeiten"><Pencil size={14} /></button>
              <button type="button" onClick={() => remove(m)} className="p-1.5 text-muted hover:text-danger" aria-label="Löschen"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <Modal title={editing.id ? 'Material bearbeiten' : 'Neues Material'} onClose={() => setEditing(null)} wide>
          <MaterialForm enrollment={enrollment} material={editing} milestones={milestones} onSave={save} />
        </Modal>
      )}
    </div>
  )
}

function MaterialForm({ enrollment, material, milestones, onSave }: { enrollment: Enrollment; material: Partial<Material>; milestones: Milestone[]; onSave: (m: Partial<Material>) => Promise<void> }) {
  const [form, setForm] = useState<Partial<Material>>({ title: '', description: '', version: '', external_url: '', instructions: '', ...material })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    setUploading(true)
    try {
      const r = await uploadFile(enrollment.id, f)
      setForm({ ...form, storage_path: r.storage_path, file_name: r.file_name, title: form.title || f.name.replace(/\.[^.]+$/, ''), kind: form.kind ?? (f.name.endsWith('.skill') ? 'skill' : 'document') })
    } catch (err) { alert((err as Error).message) }
    setUploading(false)
  }

  return (
    <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false) }} className="space-y-3">
      <div className="rounded-lg border border-dashed border-border p-4 flex flex-wrap items-center justify-between gap-3 bg-background">
        <div className="text-sm">
          {form.storage_path ? <><div className="font-medium text-foreground">{form.file_name ?? form.storage_path.split('/').pop()}</div><div className="text-xs text-muted">Datei im Coaching-Speicher</div></> : <><div className="font-medium text-foreground">Datei hochladen</div><div className="text-xs text-muted">Skill (.skill), PDF, Skript, ZIP, bis 50 MB. Oder unten einen Link eintragen.</div></>}
        </div>
        <div className="flex gap-2">
          <label className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-surface-hover cursor-pointer">
            {uploading ? <Loader2 size={13} className="animate-spin" /> : form.storage_path ? <RefreshCw size={13} /> : <Upload size={13} />} {form.storage_path ? 'Datei tauschen' : 'Datei wählen'}
            <input type="file" className="hidden" onChange={onFile} />
          </label>
          {form.storage_path && <button type="button" onClick={() => setForm({ ...form, storage_path: null, file_name: null })} className="p-1.5 text-muted hover:text-danger" aria-label="Datei entfernen"><X size={14} /></button>}
        </div>
      </div>
      <div className="grid sm:grid-cols-[1fr_150px_110px] gap-3">
        <label><span className={label}>Titel</span><input className={input} required value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label><span className={label}>Art</span><select className={input} value={form.kind ?? 'document'} onChange={(e) => setForm({ ...form, kind: e.target.value as Material['kind'] })}>{(Object.keys(MATERIAL_KIND_META) as Material['kind'][]).map((k) => <option key={k} value={k}>{MATERIAL_KIND_META[k].label}</option>)}</select></label>
        <label><span className={label}>Version</span><input className={input} value={form.version ?? ''} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="v2" /></label>
      </div>
      <label className="block"><span className={label}>Beschreibung (eine Zeile)</span><input className={input} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Reel-Skripte in deinem Ton, 4 Modi" /></label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label><span className={label}>Externer Link (Drive, Notion, Web)</span><input className={input} value={form.external_url ?? ''} onChange={(e) => setForm({ ...form, external_url: e.target.value })} /></label>
        <label><span className={label}>Gehört zu Session</span><select className={input} value={form.milestone_id ?? ''} onChange={(e) => setForm({ ...form, milestone_id: e.target.value || null })}><option value="">–</option>{milestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select></label>
      </div>
      <label className="block"><span className={label}>Anleitung (Markdown, sieht der Kunde hinter „Anleitung“)</span><textarea className={`${input} font-mono text-xs`} rows={6} value={form.instructions ?? ''} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder={'**So legst du den Skill in Claude an**\n1. claude.ai öffnen …'} /></label>
      <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.visibility === 'client'} onChange={(e) => setForm({ ...form, visibility: e.target.checked ? 'client' : 'internal' })} /> Für den Kunden freigeben</label>
      <div className="flex justify-end"><button type="submit" disabled={saving || uploading} className="btn-primary">{saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Speichern</button></div>
    </form>
  )
}

// ─── Verlauf ──────────────────────────────────────────────────────────────────

const QUICK_KINDS: Array<{ kind: EventKind; label: string }> = [
  { kind: 'coach_reply', label: 'Antwort an Kunden' },
  { kind: 'whatsapp_in', label: 'WhatsApp vom Kunden' },
  { kind: 'whatsapp_out', label: 'WhatsApp an Kunden' },
  { kind: 'note', label: 'Notiz' },
  { kind: 'plan_change', label: 'Planänderung' },
  { kind: 'mood', label: 'Nur Stimmung' },
]

const REPLYABLE: EventKind[] = ['client_blocker', 'client_win', 'whatsapp_in']

type EventPostResult = CoachingEvent & { mail_sent?: boolean; mail_error?: string | null; wa_url?: string | null }

function HistorySection({ enrollment, events }: { enrollment: Enrollment; events: CoachingEvent[] }) {
  const router = useRouter()
  const [kind, setKind] = useState<EventKind>('coach_reply')
  const [text, setText] = useState('')
  const [mood, setMood] = useState<number | ''>('')
  const [clientVisible, setClientVisible] = useState(false)
  const [notify, setNotify] = useState(true)
  const [saving, setSaving] = useState(false)
  const [replyTo, setReplyTo] = useState<CoachingEvent | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyNotify, setReplyNotify] = useState(true)
  const [lastResult, setLastResult] = useState<{ mailSent: boolean; mailError: string | null; waUrl: string | null } | null>(null)
  const canWhatsApp = !!enrollment.whatsapp_url
  const canMail = !!enrollment.client_email

  async function post(payload: Record<string, unknown>) {
    const res = await api<EventPostResult>('/api/admin/coaching/events', 'POST', { enrollment_id: enrollment.id, ...payload })
    if (payload.kind === 'coach_reply') {
      setLastResult({ mailSent: !!res.mail_sent, mailError: res.mail_error ?? null, waUrl: res.wa_url ?? null })
    }
    router.refresh()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() && mood === '') return
    setSaving(true)
    try {
      await post({ kind, body: text, mood_score: mood === '' ? null : mood, client_visible: clientVisible, notify })
      setText(''); setMood('')
    } catch (err) { alert((err as Error).message) }
    setSaving(false)
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyTo || !replyText.trim()) return
    setSaving(true)
    try {
      await post({ kind: 'coach_reply', body: replyText, reply_to: replyTo.id, notify: replyNotify })
      setReplyTo(null); setReplyText('')
    } catch (err) { alert((err as Error).message) }
    setSaving(false)
  }

  async function remove(ev: CoachingEvent) { if (!confirm('Eintrag löschen?')) return; await api(`/api/admin/coaching/events?id=${ev.id}`, 'DELETE'); router.refresh() }

  const replyPreview = (ev: CoachingEvent) => (ev.payload?.reply_to ? events.find((x) => x.id === ev.payload.reply_to) : null)

  return (
    <div className="space-y-5">
      {lastResult && (
        <div className="rounded-[var(--radius-lg)] border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground flex flex-wrap items-center justify-between gap-3">
          <span>
            Antwort ist im Dashboard des Kunden.
            {lastResult.mailSent ? ' Mail ist raus.' : lastResult.mailError ? ` Mail fehlgeschlagen: ${lastResult.mailError}` : canMail ? ' Ohne Mail.' : ' Keine E-Mail hinterlegt, deshalb keine Mail.'}
          </span>
          <div className="flex gap-2">
            {lastResult.waUrl && <a href={lastResult.waUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-hover">Auch per WhatsApp schicken</a>}
            <button type="button" onClick={() => setLastResult(null)} className="p-1 text-muted hover:text-foreground" aria-label="Schließen"><X size={14} /></button>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="card-static p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Quick-Log</h3>
        <p className="text-xs text-muted">
          „Antwort an Kunden“ erscheint im Dashboard unter Nachrichten und geht als Mail raus. Alles andere ist intern, außer du hakst „Kunde darf das sehen“ an. Stimmung sieht der Kunde nie.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_KINDS.map((q) => <button key={q.kind} type="button" onClick={() => setKind(q.kind)} className={`rounded-full border px-3 py-1 text-xs ${kind === q.kind ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-muted hover:text-foreground'}`}>{q.label}</button>)}
        </div>
        {kind !== 'mood' && <textarea className={input} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === 'coach_reply' ? `Deine Nachricht an ${enrollment.client_name.split(' ')[0]} …` : kind === 'whatsapp_in' ? 'Nachricht des Kunden hier einfügen …' : kind === 'whatsapp_out' ? 'Was du geschrieben hast …' : 'Notiz …'} />}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {kind !== 'coach_reply' && (
              <>
                <span className="text-xs text-muted">Stimmung</span>
                <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" onClick={() => setMood(mood === n ? '' : n)} className={`h-7 w-7 rounded-md text-xs font-mono border ${mood === n ? (n <= 2 ? 'bg-danger text-white border-danger' : n === 3 ? 'bg-warning text-black border-warning' : 'bg-success text-black border-success') : 'border-border text-muted hover:text-foreground'}`}>{n}</button>)}</div>
              </>
            )}
            {kind !== 'mood' && kind !== 'coach_reply' && <label className="text-xs text-muted flex items-center gap-1.5"><input type="checkbox" checked={clientVisible} onChange={(e) => setClientVisible(e.target.checked)} /> Kunde darf das sehen</label>}
            {kind === 'coach_reply' && <label className="text-xs text-muted flex items-center gap-1.5"><input type="checkbox" checked={notify} disabled={!canMail} onChange={(e) => setNotify(e.target.checked)} /> per Mail benachrichtigen{!canMail ? ' (keine E-Mail hinterlegt)' : ''}</label>}
            {kind === 'coach_reply' && canWhatsApp && <span className="text-xs text-muted">WhatsApp-Link gibt es nach dem Senden</span>}
          </div>
          <button type="submit" disabled={saving || (!text.trim() && mood === '')} className="btn-primary !py-2 !px-3.5 !text-sm">{saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} {kind === 'coach_reply' ? 'Antwort senden' : 'Eintragen'}</button>
        </div>
      </form>

      <div className="card-static divide-y divide-border">
        {events.length === 0 && <div className="p-8 text-center text-sm text-muted">Noch kein Verlauf.</div>}
        {events.map((ev) => {
          const orig = ev.kind === 'coach_reply' ? replyPreview(ev) : null
          const badge =
            ev.kind === 'client_blocker' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
              : ev.kind === 'client_win' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                : ev.kind === 'coach_reply' ? 'bg-primary text-white'
                  : ev.kind.startsWith('whatsapp') ? 'bg-primary/10 text-primary' : 'bg-surface-secondary text-muted'
          return (
            <div key={ev.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-[130px] shrink-0 text-[11px] font-mono text-muted">{fmtDate(ev.created_at, 'datetime')}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 font-mono ${badge}`}>{EVENT_KIND_META[ev.kind]?.label ?? ev.kind}</span>
                    {ev.author_name && <span className="text-muted">{ev.author_name}</span>}
                    {ev.mood_score != null && <span className="font-mono text-muted">Stimmung {ev.mood_score}/5</span>}
                    {ev.client_visible && ev.kind !== 'coach_reply' && <span className="text-muted">· sichtbar für Kunde</span>}
                  </div>
                  {orig?.body && <div className="mt-1.5 text-xs text-muted border-l-2 border-border pl-2 truncate">Antwort auf: „{orig.body}“</div>}
                  {ev.body && <div className="text-sm text-foreground mt-1 whitespace-pre-wrap">{ev.body}</div>}
                  {REPLYABLE.includes(ev.kind) && replyTo?.id !== ev.id && (
                    <button type="button" onClick={() => { setReplyTo(ev); setReplyText('') }} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-hover">Antworten</button>
                  )}
                  {replyTo?.id === ev.id && (
                    <form onSubmit={submitReply} className="mt-3 rounded-[var(--radius-lg)] border border-primary/40 bg-background p-3 space-y-2">
                      <textarea className={input} rows={3} autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={`Antwort an ${enrollment.client_name.split(' ')[0]} …`} />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs text-muted flex items-center gap-1.5"><input type="checkbox" checked={replyNotify} disabled={!canMail} onChange={(e) => setReplyNotify(e.target.checked)} /> per Mail benachrichtigen{!canMail ? ' (keine E-Mail hinterlegt)' : ''}</label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setReplyTo(null)} className="btn-ghost !text-xs">Abbrechen</button>
                          <button type="submit" disabled={saving || !replyText.trim()} className="btn-primary !py-1.5 !px-3 !text-xs !font-bold">{saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Antwort senden</button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
                <button type="button" onClick={() => remove(ev)} className="p-1 text-muted hover:text-danger shrink-0" aria-label="Löschen"><Trash2 size={13} /></button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-background border border-border rounded-2xl w-full max-h-[92vh] overflow-y-auto ${wide ? 'max-w-3xl' : 'max-w-xl'}`} onClick={(e) => e.stopPropagation()}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <button type="button" onClick={onClose} className="text-muted hover:text-foreground p-1" aria-label="Schließen"><X size={18} /></button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
