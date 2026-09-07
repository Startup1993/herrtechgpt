import type { Enrollment, Goal, Milestone, Task, CoachingEvent } from './types'

const DAY = 24 * 60 * 60 * 1000

export interface Progress {
  percent: number
  doneMilestones: number
  totalMilestones: number
  doneTasks: number
  totalTasks: number
}

/** Fortschritt = abgeschlossene Meilensteine + erledigte Kunden-Aufgaben über allem, was zählt. */
export function computeProgress(milestones: Milestone[], tasks: Task[]): Progress {
  const relevant = milestones.filter((m) => m.kind !== 'month' && m.status !== 'cancelled')
  const doneMilestones = relevant.filter((m) => m.status === 'done').length
  const clientTasks = tasks.filter((t) => t.assignee === 'client' && t.status !== 'skipped')
  const doneTasks = clientTasks.filter((t) => t.status === 'done').length
  const total = relevant.length + clientTasks.length
  const done = doneMilestones + doneTasks
  return {
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
    doneMilestones,
    totalMilestones: relevant.length,
    doneTasks,
    totalTasks: clientTasks.length,
  }
}

export function sortMilestones(milestones: Milestone[]): Milestone[] {
  return [...milestones].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity
    const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity
    return ta - tb
  })
}

/** Der nächste anstehende Meilenstein: erster nicht erledigter, nicht abgesagter. */
export function nextMilestone(milestones: Milestone[]): Milestone | null {
  const sorted = sortMilestones(milestones)
  return sorted.find((m) => m.status === 'planned' || m.status === 'scheduled') ?? null
}

/** Der letzte abgeschlossene Meilenstein (für "Letzte Session"). */
export function lastDoneMilestone(milestones: Milestone[]): Milestone | null {
  const sorted = sortMilestones(milestones).filter((m) => m.status === 'done')
  return sorted.length ? sorted[sorted.length - 1] : null
}

export interface PhaseInfo {
  /** Kurzlabel für Listen, z. B. "W3 · vor Call 3". */
  short: string
  /** Langer Text für den Kunden, z. B. "Woche 3 von 4 · vor Call 3". */
  long: string
}

export function derivePhase(enrollment: Enrollment, milestones: Milestone[]): PhaseInfo {
  if (enrollment.status === 'completed') return { short: 'abgeschlossen', long: 'Coaching abgeschlossen' }
  if (enrollment.status === 'paused') return { short: 'pausiert', long: 'Coaching pausiert' }

  const sorted = sortMilestones(milestones)
  const calls = sorted.filter((m) => m.kind === 'call' && m.status !== 'cancelled')
  const totalCalls = calls.length || 4
  const last = lastDoneMilestone(sorted)
  const next = nextMilestone(sorted)

  if (!last) {
    if (next?.kind === 'kickoff') return { short: 'vor Kickoff', long: 'Vor dem Kickoff' }
    if (next) return { short: `vor ${next.title}`, long: `Vor ${next.title}` }
    return { short: 'Start', long: 'Es geht los' }
  }

  if (next) {
    if (next.kind === 'call') {
      return { short: `W${next.number} · vor Call ${next.number}`, long: `Woche ${next.number} von ${totalCalls} · vor Call ${next.number}` }
    }
    if (next.kind === 'checkin') return { short: 'nach Call 4 · vor Tag 30', long: 'Coaching durch · Tag-30 Check-in steht an' }
    if (next.kind === 'month') return { short: `Monat ${next.number}`, long: `Monat ${next.number} · du bleibst dran` }
  }

  if (last.kind === 'call') {
    return { short: `W${last.number} · nach Call ${last.number}`, long: `Woche ${last.number} von ${totalCalls} · nach Call ${last.number}` }
  }
  if (last.kind === 'kickoff') return { short: 'W1 · nach Kickoff', long: 'Woche 1 von 4 · nach dem Kickoff' }
  return { short: 'läuft', long: 'Du bist dran' }
}

export interface Signal {
  level: 'ok' | 'warn' | 'bad' | 'info'
  label: string
}

/** Signale fürs Cockpit: was braucht Aufmerksamkeit? */
export function deriveSignals(
  enrollment: Enrollment,
  milestones: Milestone[],
  tasks: Task[],
  events: CoachingEvent[],
  now: Date = new Date(),
): Signal[] {
  const signals: Signal[] = []
  if (enrollment.status !== 'active') return signals

  const overdue = tasks.filter(
    (t) => t.assignee === 'client' && t.status === 'open' && t.due_at && new Date(t.due_at).getTime() < now.getTime(),
  ).length
  if (overdue > 0) signals.push({ level: 'bad', label: `${overdue} Aufgabe${overdue > 1 ? 'n' : ''} überfällig` })

  const blocker = events.find(
    (e) => e.kind === 'client_blocker' && now.getTime() - new Date(e.created_at).getTime() < 7 * DAY,
  )
  if (blocker) signals.push({ level: 'bad', label: 'Blocker gemeldet' })

  const next = nextMilestone(milestones)
  const hasOpenCalls = milestones.some((m) => m.kind === 'call' && m.status !== 'done' && m.status !== 'cancelled')
  if (hasOpenCalls && (!next || !next.scheduled_at)) signals.push({ level: 'bad', label: 'Nächster Termin fehlt' })

  if (enrollment.profile_id) {
    if (!enrollment.last_client_seen_at) {
      if (enrollment.invited_at) signals.push({ level: 'warn', label: 'noch nie eingeloggt' })
      else signals.push({ level: 'info', label: 'noch nicht eingeladen' })
    } else if (now.getTime() - new Date(enrollment.last_client_seen_at).getTime() > 7 * DAY) {
      const days = Math.floor((now.getTime() - new Date(enrollment.last_client_seen_at).getTime()) / DAY)
      signals.push({ level: 'warn', label: `seit ${days} Tagen kein Login` })
    }
  } else {
    signals.push({ level: 'info', label: 'kein World-Zugang' })
  }

  const coachDueToday = tasks.filter(
    (t) => t.assignee === 'coach' && t.status === 'open' && t.due_at && new Date(t.due_at).getTime() <= now.getTime() + DAY,
  ).length
  if (coachDueToday > 0) signals.push({ level: 'info', label: `${coachDueToday} Coach-Aufgabe${coachDueToday > 1 ? 'n' : ''} fällig` })

  if (next?.scheduled_at) {
    const diff = new Date(next.scheduled_at).getTime() - now.getTime()
    if (diff > 0 && diff < 2 * DAY) signals.push({ level: 'ok', label: `${next.title} in ${Math.max(1, Math.round(diff / DAY))} Tag${diff >= 1.5 * DAY ? 'en' : ''}` })
  }

  return signals
}

export function latestMood(events: CoachingEvent[]): { score: number; note: string | null; at: string } | null {
  const mood = events.filter((e) => e.kind === 'mood' && e.mood_score != null)
  if (!mood.length) return null
  const m = mood[0]
  return { score: m.mood_score as number, note: m.body, at: m.created_at }
}

export function lastContact(events: CoachingEvent[], enrollment: Enrollment): { label: string; at: string } | null {
  const contactKinds = new Set(['whatsapp_in', 'whatsapp_out', 'client_win', 'client_blocker', 'task_done', 'milestone_done', 'invite_sent'])
  const e = events.find((ev) => contactKinds.has(ev.kind))
  const candidates: Array<{ label: string; at: string }> = []
  if (e) candidates.push({ label: contactLabel(e.kind), at: e.created_at })
  if (enrollment.last_client_seen_at) candidates.push({ label: 'Login', at: enrollment.last_client_seen_at })
  if (!candidates.length) return null
  candidates.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  return candidates[0]
}

function contactLabel(kind: string): string {
  switch (kind) {
    case 'whatsapp_in': return 'WhatsApp rein'
    case 'whatsapp_out': return 'WhatsApp raus'
    case 'client_win': return 'Erfolg gemeldet'
    case 'client_blocker': return 'Blocker gemeldet'
    case 'task_done': return 'Aufgabe abgehakt'
    case 'milestone_done': return 'Session'
    case 'invite_sent': return 'Einladung'
    default: return 'Kontakt'
  }
}

export function goalsSummary(goals: Goal[]): string {
  const running = goals.filter((g) => g.status === 'running').length
  const inProgress = goals.filter((g) => g.status === 'in_progress').length
  const planned = goals.filter((g) => g.status === 'planned').length
  const stuck = goals.filter((g) => g.status === 'stuck').length
  const parts: string[] = []
  if (running) parts.push(`${running} läuft`)
  if (inProgress) parts.push(`${inProgress} in Arbeit`)
  if (stuck) parts.push(`${stuck} hängt`)
  if (planned) parts.push(`${planned} geplant`)
  return parts.join(' · ') || 'keine Workflows'
}

/** Formatierung, die überall gleich aussieht. */
export function fmtDate(iso: string | null | undefined, opts: 'date' | 'datetime' | 'weekday' = 'date'): string {
  if (!iso) return '–'
  const d = new Date(iso)
  if (opts === 'datetime') {
    return `${d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })} · ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
  }
  if (opts === 'weekday') return d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function daysUntil(iso: string | null | undefined, now: Date = new Date()): number | null {
  if (!iso) return null
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  const target = new Date(iso); target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - start.getTime()) / DAY)
}

export function relativeDays(iso: string | null | undefined, now: Date = new Date()): string {
  const d = daysUntil(iso, now)
  if (d === null) return ''
  if (d === 0) return 'heute'
  if (d === 1) return 'morgen'
  if (d === -1) return 'gestern'
  if (d > 1) return `in ${d} Tagen`
  return `vor ${Math.abs(d)} Tagen`
}
