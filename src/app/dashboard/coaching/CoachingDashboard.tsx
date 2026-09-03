'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Check, ChevronDown, ChevronUp, Copy, ExternalLink, FileText, Loader2, MessageCircle,
  Play, Sparkles, Video, Download,
} from 'lucide-react'
import type { EnrollmentBundle } from '@/lib/coaching/queries'
import type { CoachingEvent, Goal, Material, Milestone, Task } from '@/lib/coaching/types'
import { GOAL_STATUS_META, MATERIAL_KIND_META, MESSAGE_KINDS } from '@/lib/coaching/types'
import {
  computeProgress, derivePhase, fmtDate, lastDoneMilestone, nextMilestone, relativeDays, sortMilestones,
} from '@/lib/coaching/derive'
import { Markdown } from '@/components/coaching/Markdown'

interface Props {
  bundle: EnrollmentBundle
  firstName: string
  communityUrl: string
  /** Coach-Vorschau im Cockpit: keine Schreibaktionen, Hinweise eingeblendet. */
  preview?: boolean
}

export function CoachingDashboard({ bundle, firstName, communityUrl, preview = false }: Props) {
  const router = useRouter()
  const { enrollment, goals, materials } = bundle
  const [tasks, setTasks] = useState<Task[]>(bundle.tasks.filter((t) => t.assignee === 'client'))
  const [busyTask, setBusyTask] = useState<string | null>(null)

  const milestones = useMemo(() => sortMilestones(bundle.milestones), [bundle.milestones])
  const progress = computeProgress(milestones, tasks)
  const phase = derivePhase(enrollment, milestones)
  const next = nextMilestone(milestones)
  const last = lastDoneMilestone(milestones)
  const openTasks = tasks.filter((t) => t.status === 'open')
  const doneTasks = tasks.filter((t) => t.status === 'done')
  const nextDue = openTasks.filter((t) => t.due_at).sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())[0]
  const clientMaterials = materials.filter((m) => m.visibility === 'client')
  const newMaterials = clientMaterials.filter((m) => !m.first_opened_at).length
  const lastSeen = enrollment.last_client_seen_at

  async function toggleTask(task: Task) {
    if (preview) return
    setBusyTask(task.id)
    const nextStatus = task.status === 'done' ? 'open' : 'done'
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus, completed_at: nextStatus === 'done' ? new Date().toISOString() : null } : t)))
    const res = await fetch('/api/coaching/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: task.id, status: nextStatus }),
    })
    if (!res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
    }
    setBusyTask(null)
    router.refresh()
  }

  const headline = headlineFor(phase.short, enrollment.status, firstName)

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background">
      <div className="relative">
        {/* Lavendel-Glow oben, in beiden Themes dezent */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(700px_320px_at_20%_-10%,var(--ht-primary-light),transparent_70%)]" />
        <div className="relative max-w-6xl mx-auto w-full px-5 sm:px-8 pt-8 pb-24">

          {preview && (
            <div className="mb-5 rounded-[var(--radius-lg)] border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs text-foreground flex items-center gap-2">
              <Sparkles size={14} className="text-primary" /> Vorschau: So sieht {enrollment.client_name} diese Seite. Haken und Eingaben sind hier deaktiviert.
            </div>
          )}

          {/* Kopf */}
          <section className="grid lg:grid-cols-[1.25fr_.85fr] gap-6 items-stretch">
            <div className="flex flex-col justify-center gap-4">
              <div className="inline-flex items-center gap-2.5 self-start rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
                {phase.long}
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] leading-[1.02] text-foreground text-balance">
                {headline.top} <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">{headline.accent}</span>
              </h1>
              <p className="text-base sm:text-lg text-muted max-w-[56ch]">
                {enrollment.intro_text?.trim()
                  ? enrollment.intro_text
                  : introFor({ next, openTasks: openTasks.length, nextDue, status: enrollment.status })}
              </p>
              {enrollment.success_quote && (
                <blockquote className="border-l-2 border-primary pl-4 py-1 max-w-[60ch]">
                  <div className="text-base font-bold text-foreground tracking-tight">„{enrollment.success_quote}“</div>
                  <div className="text-sm text-muted mt-0.5">
                    {enrollment.north_star ? `Dein Nordstern: ${enrollment.north_star}. ` : 'Dein Nordstern aus dem Kickoff. '}Alles hier zahlt darauf ein.
                  </div>
                </blockquote>
              )}
              <div className="flex flex-wrap gap-2.5 pt-1">
                <a href="#aufgaben" className="btn-primary !font-bold shadow-[0_8px_30px_var(--ht-primary-light)]">Zu deinen Aufgaben</a>
                {last && <a href="#session" className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-hover">Was in {last.title.split(' · ')[0]} passiert ist</a>}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-primary/30 bg-surface p-5 sm:p-6 shadow-[var(--ht-shadow-card-hover)]">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,var(--ht-primary-light),transparent_55%)]" />
              <div className="relative grid grid-cols-[auto_1fr] gap-5 items-center">
                <ProgressRing percent={progress.percent} />
                <div className="grid gap-3">
                  <Kpi label="Nächster Call" value={next?.scheduled_at ? fmtDate(next.scheduled_at, 'datetime') : next ? next.title : '–'} hint={next?.scheduled_at ? relativeDays(next.scheduled_at) : next ? 'Termin folgt' : ''} />
                  <Kpi label="Aufgaben" value={`${openTasks.length} von ${tasks.length} offen`} hint={nextDue?.due_at ? `1 bis ${fmtDate(nextDue.due_at).slice(0, 5)}` : ''} />
                  <Kpi label="Workflows" value={workflowsLine(goals)} />
                  <Kpi label="Zuletzt hier" value={lastSeen ? fmtDate(lastSeen) : 'heute'} hint={doneTasks.length ? `${doneTasks.length} erledigt` : ''} />
                </div>
              </div>
            </div>
          </section>

          {/* Zeitstrahl */}
          <section className="mt-7 rounded-[var(--radius-2xl)] border border-border bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary font-semibold">Dein Weg</div>
                <h2 className="text-xl font-extrabold tracking-tight text-foreground">Vier Wochen Coaching. Zwölf Monate dran bleiben.</h2>
              </div>
              {enrollment.starts_at && (
                <span className="text-xs font-mono text-muted rounded-full border border-border px-3 py-1">
                  Start {fmtDate(enrollment.starts_at)}{enrollment.ends_at ? ` → Community bis ${fmtDate(enrollment.ends_at)}` : ''}
                </span>
              )}
            </div>
            <Timeline milestones={milestones} />
          </section>

          <div className="mt-6 grid lg:grid-cols-[1.35fr_.9fr] gap-6">
            {/* Linke Spalte */}
            <div className="flex flex-col gap-6 min-w-0">
              <section id="aufgaben" className="rounded-[var(--radius-2xl)] border border-primary/40 bg-surface p-5 sm:p-6 shadow-[0_0_0_1px_var(--ht-primary-light)_inset]">
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary font-semibold">Diese Woche</div>
                    <h2 className="text-xl font-extrabold tracking-tight text-foreground">{tasksHeadline(openTasks.length, next)}</h2>
                  </div>
                  {nextDue?.due_at && <span className="text-xs font-mono text-muted">bis {fmtDate(nextDue.due_at, 'weekday')}</span>}
                </div>
                <div className="h-1.5 rounded-full bg-border/60 overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-primary-hover to-primary shadow-[0_0_12px_var(--ht-primary-light)]" style={{ width: `${tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0}%` }} />
                </div>
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted py-4">Noch keine Aufgaben. Die erste kommt nach dem Kickoff.</p>
                ) : (
                  <div>
                    {[...openTasks, ...doneTasks].map((t) => (
                      <TaskRow key={t.id} task={t} busy={busyTask === t.id} disabled={preview} onToggle={() => toggleTask(t)} />
                    ))}
                  </div>
                )}
              </section>

              {last && (
                <section id="session">
                  <SessionCard milestone={last} materials={clientMaterials.filter((m) => m.milestone_id === last.id)} headline="Letzte Session" />
                  {milestones.filter((m) => m.status === 'done').length > 1 && (
                    <div className="mt-3 text-right">
                      <Link href="/dashboard/coaching/sessions" className="text-sm font-semibold text-primary hover:underline">Alle Sessions ansehen</Link>
                    </div>
                  )}
                </section>
              )}

              <VoiceSection
                enrollmentId={enrollment.id}
                disabled={preview}
                coachName={enrollment.coach_name}
                messages={bundle.events.filter((e) => e.client_visible && MESSAGE_KINDS.includes(e.kind))}
                seenBefore={lastSeen}
              />
            </div>

            {/* Rechte Spalte */}
            <div className="flex flex-col gap-6 min-w-0">
              <NextCallCard next={next} last={last} />

              <section className="rounded-[var(--radius-2xl)] border border-border bg-surface p-5 sm:p-6">
                <div className="mb-3">
                  <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary font-semibold">Wo wir stehen</div>
                  <h2 className="text-xl font-extrabold tracking-tight text-foreground">Deine {goals.length || 3} Workflows</h2>
                </div>
                {goals.length === 0 ? (
                  <p className="text-sm text-muted">Die Workflows legen wir im Kickoff fest.</p>
                ) : (
                  <div>
                    {goals.map((g) => <GoalRow key={g.id} goal={g} milestone={milestones.find((m) => m.id === g.milestone_id) ?? null} />)}
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-muted">
                  {(['planned', 'in_progress', 'running', 'stuck'] as Goal['status'][]).map((s) => (
                    <span key={s} className="inline-flex items-center gap-1.5"><i className={`inline-block w-2 h-2 rounded-full ${GOAL_STATUS_META[s].dot}`} />{GOAL_STATUS_META[s].clientLabel}</span>
                  ))}
                </div>
              </section>

              {enrollment.recommendation_title && (
                <section className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-primary/40 bg-surface p-5 sm:p-6">
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,var(--ht-primary-light),transparent_60%)]" />
                  <div className="relative">
                    <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary font-semibold">Empfehlung von {enrollment.coach_name?.split(' ')[0] ?? 'deinem Coach'}</div>
                    <h2 className="text-xl font-extrabold tracking-tight text-foreground mt-1">{enrollment.recommendation_title}</h2>
                    {enrollment.recommendation_text && <p className="text-sm text-muted mt-2">{enrollment.recommendation_text}</p>}
                    {enrollment.recommendation_url && (
                      <a href={enrollment.recommendation_url} target="_blank" rel="noreferrer" className="btn-primary !font-bold mt-4 inline-flex">{enrollment.recommendation_cta ?? 'Mehr erfahren'}</a>
                    )}
                  </div>
                </section>
              )}

              <section className="rounded-[var(--radius-2xl)] border border-border bg-surface p-5 sm:p-6">
                <div className="flex items-baseline justify-between gap-3 mb-3">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary font-semibold">Dein Material</div>
                    <h2 className="text-xl font-extrabold tracking-tight text-foreground">Alles, was wir für dich gebaut haben</h2>
                  </div>
                  {newMaterials > 0 && <span className="rounded-full bg-primary text-white text-[11px] font-bold px-2.5 py-1">{newMaterials} neu</span>}
                </div>
                <MaterialList materials={clientMaterials} disabled={preview} />
              </section>
            </div>
          </div>

          <footer className="mt-10 pt-5 border-t border-border flex flex-wrap justify-between gap-3 text-sm text-muted">
            <span>Deine Community, Tutorials und Live-Calls: <a href={communityUrl} target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline">KI Marketing Club auf Skool</a></span>
            <span>
              Dein Coach: {enrollment.coach_name ?? 'Herr Tech'}
              {enrollment.whatsapp_url && <> · <a href={enrollment.whatsapp_url} target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline">WhatsApp</a></>}
            </span>
          </footer>
        </div>
      </div>
    </div>
  )
}

// ─── Bausteine ────────────────────────────────────────────────────────────────

function headlineFor(phaseShort: string, status: string, firstName: string): { top: string; accent: string } {
  if (status === 'completed') return { top: `${firstName}, du hast es`, accent: 'durchgezogen.' }
  if (status === 'paused') return { top: `${firstName}, wir machen`, accent: 'kurz Pause.' }
  if (phaseShort.startsWith('vor Kickoff')) return { top: `${firstName}, es geht`, accent: 'los.' }
  if (phaseShort.startsWith('W1')) return { top: `${firstName}, das Fundament`, accent: 'steht an.' }
  if (phaseShort.startsWith('W4')) return { top: `${firstName}, jetzt wird es`, accent: 'ein System.' }
  if (phaseShort.includes('Tag 30') || phaseShort.startsWith('Monat')) return { top: `${firstName}, du bleibst`, accent: 'dran.' }
  return { top: `${firstName}, du bist`, accent: 'mitten drin.' }
}

function introFor(p: { next: Milestone | null; openTasks: number; nextDue: Task | undefined; status: string }): string {
  if (p.status === 'completed') return 'Das Coaching ist durch. Deine Workflows, dein Material und alle Sessions bleiben hier für dich.'
  const parts: string[] = []
  if (p.next?.scheduled_at) parts.push(`${p.next.title.split(' · ')[0]} ist ${relativeDays(p.next.scheduled_at)}, am ${fmtDate(p.next.scheduled_at, 'weekday')}.`)
  else if (p.next) parts.push(`${p.next.title.split(' · ')[0]} steht als Nächstes an, Termin folgt.`)
  if (p.openTasks > 0) parts.push(`Bis dahin ${p.openTasks === 1 ? 'ist eine Sache' : `sind ${p.openTasks} Sachen`} offen${p.nextDue ? `, die wichtigste: ${p.nextDue.title}` : ''}.`)
  else parts.push('Aktuell ist nichts offen. Stark.')
  return parts.join(' ')
}

function tasksHeadline(open: number, next: Milestone | null): string {
  if (open === 0) return 'Alles erledigt. So geht das.'
  const n = open === 1 ? 'Eine Sache' : open === 2 ? 'Zwei Dinge' : open === 3 ? 'Drei Dinge' : `${open} Dinge`
  return next ? `${n}. Dann ist ${next.title.split(' · ')[0]} ein Selbstläufer.` : `${n} für diese Woche.`
}

function workflowsLine(goals: Goal[]): string {
  if (!goals.length) return 'noch offen'
  const running = goals.filter((g) => g.status === 'running').length
  const inProgress = goals.filter((g) => g.status === 'in_progress').length
  const planned = goals.filter((g) => g.status === 'planned').length
  const stuck = goals.filter((g) => g.status === 'stuck').length
  const parts: string[] = []
  if (running) parts.push(`${running} läuft`)
  if (inProgress) parts.push(`${inProgress} in Arbeit`)
  if (stuck) parts.push(`${stuck} hängt`)
  if (planned) parts.push(`${planned} geplant`)
  return parts.join(' · ')
}

function ProgressRing({ percent }: { percent: number }) {
  const size = 140
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 drop-shadow-[0_0_14px_var(--ht-primary-light)]">
        <defs>
          <linearGradient id="coaching-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--ht-primary-hover)" />
            <stop offset="1" stopColor="var(--ht-primary)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ht-border)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#coaching-ring)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-4xl font-black tracking-[-0.04em] leading-none text-foreground">{percent}<span className="text-lg font-bold">%</span></div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.12em] text-muted">Fortschritt</div>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="text-[15px] font-extrabold tracking-tight text-foreground">
        {value}{hint ? <span className="ml-2 text-xs font-medium text-muted">{hint}</span> : null}
      </div>
    </div>
  )
}

function Timeline({ milestones }: { milestones: Milestone[] }) {
  const visible = milestones.filter((m) => m.status !== 'cancelled')
  const nextIdx = visible.findIndex((m) => m.status !== 'done')
  const doneCount = nextIdx === -1 ? visible.length : nextIdx
  const pct = visible.length > 1 ? Math.max(0, Math.min(100, ((doneCount - 0.5) / (visible.length - 1)) * 100)) : 0
  if (!visible.length) return <p className="text-sm text-muted">Termine folgen nach dem Kickoff.</p>
  return (
    <div className="relative overflow-x-auto pb-2">
      <div className="relative min-w-[640px]" style={{ display: 'grid', gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}>
        <div className="absolute left-[7%] right-[7%] top-[15px] h-0.5 bg-border">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        {visible.map((m, i) => {
          const done = m.status === 'done'
          const isNext = i === nextIdx
          const far = m.kind === 'month' || (m.kind === 'checkin' && !isNext && !done)
          return (
            <div key={m.id} className={`relative flex flex-col items-center gap-1.5 text-center px-1 ${far ? 'opacity-60' : ''}`}>
              <div className={`relative z-10 grid h-[30px] w-[30px] place-items-center rounded-full border-2 text-xs font-extrabold ${
                done ? 'border-primary bg-primary text-white shadow-[0_0_16px_var(--ht-primary-light)]'
                  : isNext ? 'border-primary bg-surface text-primary' : 'border-border bg-background text-muted'}`}>
                {done ? <Check size={14} strokeWidth={3} /> : m.kind === 'checkin' ? m.number : m.kind === 'month' ? '∞' : m.kind === 'kickoff' ? 'K' : m.number}
                {isNext && <span className="absolute inset-0 rounded-full border-2 border-primary opacity-60 motion-safe:animate-ping" />}
              </div>
              <div className={`text-[13px] font-bold ${isNext ? 'text-primary' : 'text-foreground'}`}>{m.title.split(' · ')[0]}</div>
              <div className={`text-[11px] font-mono ${m.status === 'scheduled' || done ? 'text-muted' : 'text-muted-light'}`}>
                {m.scheduled_at ? fmtDate(m.scheduled_at).slice(0, 6) : 'noch offen'}
              </div>
              {m.goal && <div className="text-[11px] text-muted leading-snug max-w-[120px]">{m.title.includes(' · ') ? m.title.split(' · ').slice(1).join(' · ') : m.goal.length > 40 ? `${m.goal.slice(0, 40)}…` : m.goal}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TaskRow({ task, busy, disabled, onToggle }: { task: Task; busy: boolean; disabled: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [now] = useState(() => Date.now())
  const done = task.status === 'done'
  const hasDetails = !!(task.instructions || task.copy_prompt || task.link_url)
  const overdue = !done && task.due_at && new Date(task.due_at).getTime() < now

  async function copyPrompt() {
    if (!task.copy_prompt) return
    try { await navigator.clipboard.writeText(task.copy_prompt); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }

  return (
    <div className="border-t border-border first:border-t-0 py-3.5">
      <div className="grid grid-cols-[auto_1fr_auto] gap-3.5 items-start">
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled || busy}
          aria-label={done ? 'Als offen markieren' : 'Als erledigt markieren'}
          className={`mt-0.5 grid h-6 w-6 place-items-center rounded-lg border-2 transition-all ${
            done ? 'border-transparent bg-gradient-to-br from-primary-hover to-primary text-white shadow-[0_0_14px_var(--ht-primary-light)]' : 'border-border bg-background hover:border-primary'} disabled:opacity-60`}
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : done ? <Check size={14} strokeWidth={3} /> : null}
        </button>
        <div className="min-w-0">
          <div className={`text-[15px] font-bold tracking-tight ${done ? 'text-muted line-through' : 'text-foreground'}`}>{task.title}</div>
          {task.description && <div className={`text-[13px] mt-0.5 ${done ? 'text-muted-light' : 'text-muted'}`}>{task.description}</div>}
          {hasDetails && !done && (
            <div className="mt-2 flex flex-wrap gap-2">
              {(task.instructions || task.copy_prompt) && (
                <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-hover">
                  Anleitung {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              )}
              {task.copy_prompt && (
                <button type="button" onClick={copyPrompt} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-hover">
                  <Copy size={13} /> {copied ? 'Kopiert' : 'Prompt kopieren'}
                </button>
              )}
              {task.link_url && (
                <a href={task.link_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-hover">
                  <ExternalLink size={13} /> Öffnen
                </a>
              )}
            </div>
          )}
          {open && (
            <div className="mt-3 rounded-[var(--radius-lg)] border border-border bg-background p-4 space-y-3">
              {task.instructions && <Markdown text={task.instructions} />}
              {task.copy_prompt && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted mb-1.5">Prompt für Claude</div>
                  <pre className="whitespace-pre-wrap rounded-lg bg-surface-secondary border border-border p-3 text-xs text-foreground font-mono leading-relaxed">{task.copy_prompt}</pre>
                </div>
              )}
            </div>
          )}
        </div>
        <div className={`text-[11px] font-mono whitespace-nowrap text-right ${overdue ? 'text-danger' : done ? 'text-muted-light' : 'text-muted'}`}>
          {done && task.completed_at ? `erledigt ${fmtDate(task.completed_at).slice(0, 6)}` : task.due_at ? `bis ${fmtDate(task.due_at, 'weekday').split(',')[0].slice(0, 2)} ${fmtDate(task.due_at).slice(0, 6)}` : ''}
        </div>
      </div>
    </div>
  )
}

function GoalRow({ goal, milestone }: { goal: Goal; milestone: Milestone | null }) {
  const meta = GOAL_STATUS_META[goal.status]
  const plannedIn = goal.status === 'planned' && milestone ? ` · ${milestone.title.split(' · ')[0]}` : ''
  return (
    <div className="grid grid-cols-[auto_1fr] gap-3.5 py-3.5 border-t border-border first:border-t-0 items-start">
      <span className={`mt-1.5 h-3.5 w-3.5 rounded-full ${meta.dot}`} />
      <div>
        <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] font-bold tracking-tight ${goal.status === 'planned' ? 'text-muted' : 'text-foreground'}`}>
          {goal.title}
          <span className={`text-[11px] font-mono font-medium ${meta.text}`}>{meta.clientLabel}{plannedIn}</span>
        </div>
        {(goal.status_note || goal.description) && <div className="text-[13px] text-muted mt-0.5">{goal.status_note || goal.description}</div>}
      </div>
    </div>
  )
}

function NextCallCard({ next, last }: { next: Milestone | null; last: Milestone | null }) {
  if (!next) return null
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-surface p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,var(--ht-primary-light),transparent_60%)]" />
      <div className="relative">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary font-semibold">Nächster Call</div>
        <div className="text-3xl font-black tracking-[-0.03em] leading-none mt-1.5 text-foreground">
          {next.scheduled_at ? fmtDate(next.scheduled_at, 'datetime').split(' · ')[0] : 'Termin folgt'}
          {next.scheduled_at && <span className="ml-2 text-sm font-medium text-muted tracking-normal">{fmtDate(next.scheduled_at, 'datetime').split(' · ')[1]}</span>}
        </div>
        <div className="text-sm text-muted mt-1.5">{next.title}{next.scheduled_at ? ` · ${relativeDays(next.scheduled_at)}` : ''}</div>
        <ul className="mt-4 grid gap-2.5 text-sm">
          {next.goal && <li className="grid grid-cols-[64px_1fr] gap-2"><span className="font-mono text-[11px] text-primary pt-0.5">Ziel</span><span className="text-foreground font-medium">{next.goal}</span></li>}
          {next.bring_along && <li className="grid grid-cols-[64px_1fr] gap-2"><span className="font-mono text-[11px] text-primary pt-0.5">Bring mit</span><span className="text-muted">{next.bring_along}</span></li>}
          {last?.open_items && !next.bring_along && <li className="grid grid-cols-[64px_1fr] gap-2"><span className="font-mono text-[11px] text-primary pt-0.5">Offen</span><span className="text-muted">{last.open_items.split('\n')[0]}</span></li>}
        </ul>
        {next.meeting_url && (
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={next.meeting_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-hover"><Video size={13} /> Meeting-Link</a>
          </div>
        )}
      </div>
    </section>
  )
}

export function SessionCard({ milestone: m, materials, headline }: { milestone: Milestone; materials: Material[]; headline?: string }) {
  const hasStand = !!(m.done_items || m.open_items)
  return (
    <section className="rounded-[var(--radius-2xl)] border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary font-semibold">{headline ?? 'Session'}</div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">{m.title}</h2>
        </div>
        <span className="text-xs font-mono text-muted">{m.scheduled_at ? fmtDate(m.scheduled_at, 'datetime') : ''}</span>
      </div>
      {m.goal && <p className="text-sm text-muted mb-4">{m.goal}</p>}

      <div className={`grid gap-3.5 ${hasStand ? 'md:grid-cols-2' : ''}`}>
        <div className="rounded-[var(--radius-lg)] border border-border bg-background p-4">
          <h4 className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted mb-2">Was wir gemacht haben</h4>
          {m.summary ? <Markdown text={m.summary} /> : <p className="text-sm text-muted">Zusammenfassung folgt.</p>}
        </div>
        {hasStand && (
          <div className="grid gap-3.5 content-start">
            {m.done_items && (
              <div className="rounded-[var(--radius-lg)] border border-border bg-background p-4">
                <h4 className="text-[11px] font-mono uppercase tracking-[0.12em] text-success mb-2">Erledigt</h4>
                <Markdown text={m.done_items} />
              </div>
            )}
            {m.open_items && (
              <div className="rounded-[var(--radius-lg)] border border-border bg-background p-4">
                <h4 className="text-[11px] font-mono uppercase tracking-[0.12em] text-warning mb-2">Offen</h4>
                <Markdown text={m.open_items} />
              </div>
            )}
          </div>
        )}
      </div>

      {m.decisions && (
        <div className="mt-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted mb-1.5">Entscheidungen, die jetzt gelten</div>
          <Markdown text={m.decisions} />
        </div>
      )}

      {(m.recording_url || m.recap_url || materials.length > 0) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {m.recording_url && <FileChip href={m.recording_url} icon={<Play size={13} />} label="Aufzeichnung ansehen" tone="danger" />}
          {m.recap_url && <FileChip href={m.recap_url} icon={<FileText size={13} />} label="Recap als PDF" tone="warning" />}
          {materials.map((mat) => (
            <FileChip key={mat.id} href={mat.signed_url ?? mat.external_url ?? '#'} icon={<Download size={13} />} label={mat.title} tone="success" />
          ))}
        </div>
      )}
    </section>
  )
}

function FileChip({ href, icon, label, tone }: { href: string; icon: React.ReactNode; label: string; tone: 'danger' | 'warning' | 'success' | 'primary' }) {
  const dot = { danger: 'bg-danger', warning: 'bg-warning', success: 'bg-success', primary: 'bg-primary' }[tone]
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-background px-3 py-2 text-[13px] font-semibold text-foreground hover:border-primary">
      <span className={`h-2 w-2 rounded-sm ${dot}`} />{icon}{label}
    </a>
  )
}

function MaterialList({ materials, disabled }: { materials: Material[]; disabled: boolean }) {
  const [opened, setOpened] = useState<Record<string, boolean>>({})
  const [showInstr, setShowInstr] = useState<string | null>(null)
  if (!materials.length) return <p className="text-sm text-muted">Noch nichts hier. Sobald wir etwas für dich bauen, taucht es hier auf.</p>

  const groups: Array<{ label: string; kinds: Material['kind'][] }> = [
    { label: 'Skills für dein Claude', kinds: ['skill'] },
    { label: 'Skripte', kinds: ['script'] },
    { label: 'Analysen und Dokumente', kinds: ['analysis', 'document', 'other'] },
    { label: 'Aufzeichnungen', kinds: ['recording'] },
  ]

  async function markOpened(m: Material) {
    if (disabled || m.first_opened_at || opened[m.id]) return
    setOpened((o) => ({ ...o, [m.id]: true }))
    fetch('/api/coaching/materials', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ materialId: m.id }) }).catch(() => {})
  }

  return (
    <div className="grid gap-2.5">
      {groups.map((g) => {
        const items = materials.filter((m) => g.kinds.includes(m.kind))
        if (!items.length) return null
        return (
          <div key={g.label}>
            <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted mb-1.5 mt-2 first:mt-0">{g.label}</div>
            <div className="grid gap-2">
              {items.map((m) => {
                const isNew = !m.first_opened_at && !opened[m.id]
                const href = m.signed_url ?? m.external_url ?? null
                const meta = MATERIAL_KIND_META[m.kind]
                return (
                  <div key={m.id} className={`rounded-[var(--radius-lg)] border bg-background p-3 ${isNew ? 'border-primary/50' : 'border-border'}`}>
                    <div className="grid grid-cols-[44px_1fr] gap-3 items-center">
                      <div className={`grid h-11 w-11 place-items-center rounded-xl border text-[10px] font-mono font-bold tracking-wide ${m.kind === 'skill' ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border bg-surface-secondary text-muted'}`}>{meta.short}</div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-foreground">
                          <span className="truncate">{m.title}</span>
                          {isNew && <span className="rounded-full bg-primary text-white text-[10px] font-bold px-2 py-0.5">neu</span>}
                        </div>
                        <div className="text-[11px] font-mono text-muted mt-0.5">
                          {[m.version, fmtDate(m.created_at).slice(0, 6), m.description].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {m.instructions && (
                        <button type="button" onClick={() => setShowInstr(showInstr === m.id ? null : m.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-hover">
                          Anleitung {showInstr === m.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      )}
                      {href && (
                        <a href={href} target="_blank" rel="noreferrer" onClick={() => markOpened(m)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-hover">
                          {m.storage_path ? <Download size={13} /> : <ExternalLink size={13} />} {m.storage_path ? 'Datei' : 'Öffnen'}
                        </a>
                      )}
                    </div>
                    {showInstr === m.id && m.instructions && (
                      <div className="mt-3 rounded-[var(--radius-md)] border border-border bg-surface p-3.5"><Markdown text={m.instructions} /></div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function VoiceSection({ enrollmentId, disabled, coachName, messages, seenBefore }: {
  enrollmentId: string
  disabled: boolean
  coachName: string | null
  messages: CoachingEvent[]
  seenBefore: string | null
}) {
  const [win, setWin] = useState('')
  const [blocker, setBlocker] = useState('')
  const [sent, setSent] = useState<'win' | 'blocker' | null>(null)
  const [busy, setBusy] = useState<'win' | 'blocker' | null>(null)
  const [showAll, setShowAll] = useState(false)
  const router = useRouter()
  const coach = coachName ?? 'Dein Coach'
  const seenAt = seenBefore ? new Date(seenBefore).getTime() : 0
  const newReplies = messages.filter((m) => m.kind === 'coach_reply' && new Date(m.created_at).getTime() > seenAt).length
  const visible = showAll ? messages : messages.slice(0, 6)

  async function send(kind: 'client_win' | 'client_blocker') {
    const body = kind === 'client_win' ? win : blocker
    if (!body.trim() || disabled) return
    setBusy(kind === 'client_win' ? 'win' : 'blocker')
    const res = await fetch('/api/coaching/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollmentId, kind, body: body.trim() }),
    })
    setBusy(null)
    if (res.ok) {
      setSent(kind === 'client_win' ? 'win' : 'blocker')
      if (kind === 'client_win') setWin(''); else setBlocker('')
      setTimeout(() => setSent(null), 4000)
      router.refresh()
    }
  }

  return (
    <section className="rounded-[var(--radius-2xl)] border border-border bg-surface p-5 sm:p-6">
      <div className="mb-3">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary font-semibold">Deine Stimme</div>
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">Sag früh, wenn es hakt.</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-3.5">
        <div className="rounded-[var(--radius-lg)] border border-success/40 bg-background p-4">
          <h4 className="text-[15px] font-extrabold tracking-tight text-foreground">Das läuft</h4>
          <p className="text-[13px] text-muted mt-1 mb-3">Ein Erfolg, ein Aha-Moment, irgendwas, das funktioniert hat. Landet bei {coachName ?? 'deinem Coach'} und in deinem Verlauf.</p>
          <textarea value={win} onChange={(e) => setWin(e.target.value)} disabled={disabled} rows={3} placeholder="Reel 1 ist online, 4.200 Views nach 6 Stunden …" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground resize-y disabled:opacity-60" />
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <small className="text-xs text-muted">{sent === 'win' ? 'Eingetragen. Stark.' : 'Sichtbar für dich und deinen Coach'}</small>
            <button type="button" onClick={() => send('client_win')} disabled={disabled || busy !== null || !win.trim()} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-hover disabled:opacity-50">
              {busy === 'win' ? <Loader2 size={13} className="animate-spin" /> : null} Eintragen
            </button>
          </div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-danger/40 bg-background p-4">
          <h4 className="text-[15px] font-extrabold tracking-tight text-foreground">Hier hänge ich</h4>
          <p className="text-[13px] text-muted mt-1 mb-3">Tool zickt, Datei lädt nicht, keine Zeit gefunden. Egal was. {coachName ?? 'Dein Coach'} bekommt sofort Bescheid.</p>
          <textarea value={blocker} onChange={(e) => setBlocker(e.target.value)} disabled={disabled} rows={3} placeholder="Die Skill-Datei lässt sich nicht hochladen …" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground resize-y disabled:opacity-60" />
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <small className="text-xs text-muted">{sent === 'blocker' ? 'Ist raus. Antwort kommt.' : 'Antwort meist innerhalb weniger Stunden'}</small>
            <button type="button" onClick={() => send('client_blocker')} disabled={disabled || busy !== null || !blocker.trim()} className="btn-primary !py-1.5 !px-3 !text-xs !font-bold disabled:opacity-50">
              {busy === 'blocker' ? <Loader2 size={13} className="animate-spin" /> : <MessageCircle size={13} />} Coach anpingen
            </button>
          </div>
        </div>
      </div>

      {/* Nachrichten-Verlauf: was der Kunde geschickt hat, was der Coach geantwortet hat */}
      <div className="mt-5 pt-4 border-t border-border">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted font-semibold">Nachrichten mit {coach.split(' ')[0]}</h3>
          {newReplies > 0 && <span className="rounded-full bg-primary text-white text-[11px] font-bold px-2.5 py-1">{newReplies} neue Antwort{newReplies > 1 ? 'en' : ''}</span>}
        </div>
        {messages.length === 0 ? (
          <p className="text-sm text-muted">Noch keine Nachrichten. Was du oben einträgst, erscheint hier, genauso wie die Antworten von {coach.split(' ')[0]}.</p>
        ) : (
          <div className="grid gap-2.5">
            {visible.map((m) => {
              const fromCoach = m.kind === 'coach_reply'
              const isNew = fromCoach && new Date(m.created_at).getTime() > seenAt
              return (
                <div key={m.id} className={`flex ${fromCoach ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-[var(--radius-lg)] px-4 py-3 border ${
                    fromCoach ? `bg-primary/10 ${isNew ? 'border-primary' : 'border-primary/30'}` : m.kind === 'client_blocker' ? 'bg-background border-danger/40' : 'bg-background border-success/40'}`}>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted mb-1">
                      <span className={`font-semibold ${fromCoach ? 'text-primary' : 'text-foreground'}`}>{fromCoach ? (m.author_name ?? coach) : 'Du'}</span>
                      <span>{fmtDate(m.created_at, 'datetime')}</span>
                      {!fromCoach && <span>{m.kind === 'client_blocker' ? '· Hier hänge ich' : '· Das läuft'}</span>}
                      {isNew && <span className="rounded-full bg-primary text-white px-1.5 py-0.5 text-[10px] font-bold">neu</span>}
                    </div>
                    <div className="text-sm text-foreground whitespace-pre-wrap">{m.body}</div>
                  </div>
                </div>
              )
            })}
            {messages.length > 6 && (
              <button type="button" onClick={() => setShowAll((v) => !v)} className="text-xs font-semibold text-primary hover:underline text-left">{showAll ? 'Weniger anzeigen' : `Alle ${messages.length} Nachrichten anzeigen`}</button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
