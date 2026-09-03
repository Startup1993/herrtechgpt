export type EnrollmentStatus = 'active' | 'completed' | 'paused'
export type WorldMode = 'program_only' | 'program_plus_toolbox' | 'full'
export type MilestoneKind = 'kickoff' | 'call' | 'checkin' | 'month'
export type MilestoneStatus = 'planned' | 'scheduled' | 'done' | 'cancelled'
export type TaskAssignee = 'client' | 'coach'
export type TaskKind = 'homework' | 'promise' | 'cadence'
export type TaskStatus = 'open' | 'done' | 'skipped'
export type GoalStatus = 'planned' | 'in_progress' | 'running' | 'stuck'
export type MaterialKind = 'skill' | 'script' | 'document' | 'analysis' | 'recording' | 'other'
export type Visibility = 'internal' | 'client'
export type EventKind =
  | 'whatsapp_in' | 'whatsapp_out' | 'note' | 'schedule_change' | 'plan_change'
  | 'task_done' | 'task_reopened' | 'milestone_done' | 'material_added'
  | 'login' | 'client_win' | 'client_blocker' | 'mood' | 'invite_sent' | 'coach_reply'

export interface Program {
  key: string
  title: string
  kind: string
  duration_days: number
  template: ProgramTemplate
}

export interface ProgramTemplate {
  milestones?: Array<{ kind: MilestoneKind; number: number; title: string; goal?: string; offset_days?: number }>
  coach_cadence?: Array<{ title: string; offset_days?: number; offset_hours?: number }>
  coach_prep?: Array<{ title: string; offset_days?: number }>
}

export interface Enrollment {
  id: string
  program_key: string
  profile_id: string | null
  client_name: string
  client_email: string | null
  company: string | null
  coach_name: string | null
  coach_profile_id: string | null
  status: EnrollmentStatus
  world_mode: WorldMode
  starts_at: string | null
  ends_at: string | null
  track: string | null
  persona: string | null
  north_star: string | null
  success_quote: string | null
  intro_text: string | null
  nps: number | null
  upsell_status: string | null
  case_study: boolean
  notion_url: string | null
  drive_url: string | null
  whatsapp_url: string | null
  community_url: string | null
  last_client_seen_at: string | null
  invited_at: string | null
  recommendation_title: string | null
  recommendation_text: string | null
  recommendation_url: string | null
  recommendation_cta: string | null
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  enrollment_id: string
  kind: MilestoneKind
  number: number
  title: string
  goal: string | null
  success_criterion: string | null
  scheduled_at: string | null
  status: MilestoneStatus
  summary: string | null
  decisions: string | null
  done_items: string | null
  open_items: string | null
  bring_along: string | null
  recording_url: string | null
  recap_url: string | null
  recap_storage_path: string | null
  meeting_url: string | null
  sort_order: number
}

export interface Task {
  id: string
  enrollment_id: string
  milestone_id: string | null
  title: string
  description: string | null
  instructions: string | null
  copy_prompt: string | null
  link_url: string | null
  due_at: string | null
  assignee: TaskAssignee
  kind: TaskKind
  status: TaskStatus
  completed_at: string | null
  proof_url: string | null
  sort_order: number
  created_at: string
}

export interface Goal {
  id: string
  enrollment_id: string
  milestone_id: string | null
  title: string
  description: string | null
  status: GoalStatus
  status_note: string | null
  stuck_since: string | null
  baseline: string | null
  result: string | null
  sort_order: number
}

export interface Material {
  id: string
  enrollment_id: string
  milestone_id: string | null
  kind: MaterialKind
  title: string
  description: string | null
  version: string | null
  external_url: string | null
  storage_path: string | null
  file_name: string | null
  instructions: string | null
  visibility: Visibility
  first_opened_at: string | null
  sort_order: number
  created_at: string
  /** Serverseitig erzeugte, zeitlich begrenzte Download-URL. */
  signed_url?: string | null
}

export interface CoachingEvent {
  id: string
  enrollment_id: string
  author_profile_id: string | null
  author_name: string | null
  kind: EventKind
  body: string | null
  payload: Record<string, unknown>
  mood_score: number | null
  client_visible: boolean
  created_at: string
}

export const WORLD_MODE_META: Record<WorldMode, { label: string; hint: string }> = {
  program_only: { label: 'Nur Coaching', hint: 'Sidebar zeigt nur Mein Coaching, Hilfe und Konto.' },
  program_plus_toolbox: { label: 'Coaching + Toolbox', hint: 'Zusätzlich die KI Toolbox (Carousel, Video-Tools).' },
  full: { label: 'Volle World', hint: 'Alles, was das Tier erlaubt. Für den Alumni-Übergang.' },
}

export const ENROLLMENT_STATUS_META: Record<EnrollmentStatus, { label: string; badge: string }> = {
  active: { label: 'aktiv', badge: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
  paused: { label: 'pausiert', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
  completed: { label: 'abgeschlossen', badge: 'bg-surface-secondary text-muted' },
}

export const GOAL_STATUS_META: Record<GoalStatus, { label: string; clientLabel: string; dot: string; text: string }> = {
  planned: { label: 'Geplant', clientLabel: 'geplant', dot: 'bg-border', text: 'text-muted' },
  in_progress: { label: 'In Arbeit', clientLabel: 'in Arbeit', dot: 'bg-warning shadow-[0_0_12px_rgba(251,191,36,.55)]', text: 'text-warning' },
  running: { label: 'Läuft beim Kunden', clientLabel: 'läuft bei dir', dot: 'bg-success shadow-[0_0_12px_rgba(52,211,153,.55)]', text: 'text-success' },
  stuck: { label: 'Hängt', clientLabel: 'hängt', dot: 'bg-danger shadow-[0_0_12px_rgba(248,113,113,.55)]', text: 'text-danger' },
}

export const MILESTONE_KIND_META: Record<MilestoneKind, { label: string }> = {
  kickoff: { label: 'Kickoff' },
  call: { label: 'Call' },
  checkin: { label: 'Check-in' },
  month: { label: 'Monat' },
}

export const MATERIAL_KIND_META: Record<MaterialKind, { label: string; short: string }> = {
  skill: { label: 'Skill für Claude', short: 'SKILL' },
  script: { label: 'Skript', short: 'TXT' },
  document: { label: 'Dokument', short: 'PDF' },
  analysis: { label: 'Analyse', short: 'WEB' },
  recording: { label: 'Aufzeichnung', short: 'REC' },
  other: { label: 'Sonstiges', short: 'FILE' },
}

export const EVENT_KIND_META: Record<EventKind, { label: string }> = {
  whatsapp_in: { label: 'WhatsApp vom Kunden' },
  whatsapp_out: { label: 'WhatsApp an den Kunden' },
  note: { label: 'Notiz' },
  schedule_change: { label: 'Termin geändert' },
  plan_change: { label: 'Plan geändert' },
  task_done: { label: 'Aufgabe erledigt' },
  task_reopened: { label: 'Aufgabe wieder offen' },
  milestone_done: { label: 'Session abgeschlossen' },
  material_added: { label: 'Material hinzugefügt' },
  login: { label: 'Login' },
  client_win: { label: 'Das läuft (Kunde)' },
  client_blocker: { label: 'Hier hänge ich (Kunde)' },
  mood: { label: 'Stimmung' },
  invite_sent: { label: 'Einladung verschickt' },
  coach_reply: { label: 'Antwort an den Kunden' },
}

/** Ereignisse, die auf der Kundenseite als Nachrichten-Verlauf erscheinen. */
export const MESSAGE_KINDS: EventKind[] = ['client_win', 'client_blocker', 'coach_reply']

export const COACH_OPTIONS = ['Jacob', 'Jonas', 'Flo'] as const
export const TRACK_OPTIONS = ['A', 'B', 'C', 'D', 'A/B', 'B/C', 'C/B', 'C/D', 'B+C'] as const
