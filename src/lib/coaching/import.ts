import type { SupabaseClient } from '@supabase/supabase-js'
import type { Enrollment, EventKind, Goal, GoalStatus, Material, MaterialKind, Milestone, MilestoneKind, MilestoneStatus, Program, Task, TaskAssignee, TaskKind, TaskStatus, WorldMode } from './types'
import { createCoachCadenceTasks } from './template'
import { logEvent } from './queries'
import { sendCoachingInviteEmail } from './emails'
import { getAppSettings } from '@/lib/app-settings'

/**
 * Import-Vertrag für das Coaching-Plugin (nach-kickoff, nach-call, /notiz,
 * /kunde-importieren) und später n8n. Alles ist optional, alles wird
 * idempotent zusammengeführt:
 *   - Teilnahme: nach id, sonst client_email, sonst client_name
 *   - Meilenstein: nach (kind, number)
 *   - Workflow: nach Titel (ohne Groß/Klein)
 *   - Aufgabe: nach Titel innerhalb desselben Meilensteins
 *   - Material: nach Titel
 *   - Ereignis: nach (kind, body, Minute)
 * `milestone_ref` verweist auf "kind:number", z. B. "call:2" oder "kickoff:0".
 */
export interface ImportPayload {
  enrollment: {
    id?: string
    client_email?: string | null
    client_name?: string
    company?: string | null
    coach_name?: string | null
    program_key?: string
    status?: Enrollment['status']
    world_mode?: WorldMode
    starts_at?: string | null
    ends_at?: string | null
    track?: string | null
    persona?: string | null
    north_star?: string | null
    success_quote?: string | null
    intro_text?: string | null
    nps?: number | null
    upsell_status?: string | null
    case_study?: boolean
    notion_url?: string | null
    drive_url?: string | null
    whatsapp_url?: string | null
    community_url?: string | null
    /** World-Account anlegen oder verknüpfen (braucht client_email). */
    create_account?: boolean
    /** Einladung „Dein Coaching-Zugang“ senden (nur mit create_account). */
    send_invite?: boolean
  }
  goals?: Array<{
    title: string
    description?: string | null
    status?: GoalStatus
    status_note?: string | null
    baseline?: string | null
    result?: string | null
    milestone_ref?: string | null
  }>
  milestones?: Array<{
    kind: MilestoneKind
    number: number
    title?: string
    goal?: string | null
    success_criterion?: string | null
    scheduled_at?: string | null
    status?: MilestoneStatus
    summary?: string | null
    decisions?: string | null
    done_items?: string | null
    open_items?: string | null
    bring_along?: string | null
    recording_url?: string | null
    recap_url?: string | null
    meeting_url?: string | null
    /** Coach-Cadence-Aufgaben anlegen, wenn Termin gesetzt (Standard true bei neu). */
    with_cadence?: boolean
    change_reason?: string | null
  }>
  tasks?: Array<{
    title: string
    milestone_ref?: string | null
    description?: string | null
    instructions?: string | null
    copy_prompt?: string | null
    link_url?: string | null
    due_at?: string | null
    assignee?: TaskAssignee
    kind?: TaskKind
    status?: TaskStatus
  }>
  materials?: Array<{
    title: string
    milestone_ref?: string | null
    kind?: MaterialKind
    description?: string | null
    version?: string | null
    external_url?: string | null
    instructions?: string | null
    visibility?: Material['visibility']
  }>
  events?: Array<{
    kind: EventKind
    body?: string | null
    mood_score?: number | null
    created_at?: string | null
    client_visible?: boolean
    payload?: Record<string, unknown>
  }>
  /** Wer importiert (steht im Verlauf). */
  author_name?: string | null
}

export interface ImportResult {
  enrollment_id: string
  created_enrollment: boolean
  profile_id: string | null
  counts: { goals: number; milestones: number; tasks: number; materials: number; events: number }
  invite_sent: boolean
  invite_error: string | null
  dashboard_url: string
  cockpit_url: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ENROLLMENT_FIELDS = [
  'client_name', 'client_email', 'company', 'coach_name', 'program_key', 'status', 'world_mode', 'starts_at', 'ends_at',
  'track', 'persona', 'north_star', 'success_quote', 'intro_text', 'nps', 'upsell_status', 'case_study',
  'notion_url', 'drive_url', 'whatsapp_url', 'community_url',
] as const

function norm(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase()
}

function parseRef(ref: string | null | undefined): { kind: MilestoneKind; number: number } | null {
  if (!ref) return null
  const [kind, num] = ref.split(':')
  if (!['kickoff', 'call', 'checkin', 'month'].includes(kind)) return null
  const n = Number(num ?? 0)
  return Number.isInteger(n) ? { kind: kind as MilestoneKind, number: n } : null
}

function isoOrNull(v: string | null | undefined): string | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

async function ensureProfile(admin: SupabaseClient, email: string, fullName: string): Promise<string> {
  const { data: page } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existing = page?.users?.find((u) => u.email?.toLowerCase() === email)
  if (existing) {
    await admin.from('profiles').update({ full_name: fullName }).eq('id', existing.id).is('full_name', null)
    return existing.id
  }
  const { data: created, error } = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name: fullName } })
  if (error || !created.user) throw new Error(error?.message ?? 'Account konnte nicht angelegt werden')
  await admin.from('profiles').update({ full_name: fullName, access_tier: 'basic' }).eq('id', created.user.id)
  return created.user.id
}

export async function importBundle(admin: SupabaseClient, payload: ImportPayload, baseUrl: string): Promise<ImportResult> {
  const author = payload.author_name ?? 'Coaching-Plugin'
  const e = payload.enrollment ?? {}
  const email = e.client_email ? e.client_email.trim().toLowerCase() : null
  if (email && !EMAIL_REGEX.test(email)) throw new Error('Ungültige E-Mail-Adresse')

  // ── Teilnahme finden ────────────────────────────────────────────────
  let existing: Enrollment | null = null
  if (e.id) {
    const { data } = await admin.from('coaching_enrollments').select('*').eq('id', e.id).maybeSingle()
    existing = (data as Enrollment | null) ?? null
    if (!existing) throw new Error(`Teilnahme ${e.id} nicht gefunden`)
  } else if (email) {
    const { data } = await admin.from('coaching_enrollments').select('*').eq('client_email', email).order('created_at', { ascending: false }).limit(1).maybeSingle()
    existing = (data as Enrollment | null) ?? null
  }
  if (!existing && e.client_name) {
    const { data } = await admin.from('coaching_enrollments').select('*').ilike('client_name', e.client_name.trim()).order('created_at', { ascending: false }).limit(1).maybeSingle()
    existing = (data as Enrollment | null) ?? null
  }
  if (!existing && !e.client_name) throw new Error('client_name fehlt (neue Teilnahme)')

  // ── Account ─────────────────────────────────────────────────────────
  let profileId = existing?.profile_id ?? null
  if (e.create_account && email && !profileId) {
    profileId = await ensureProfile(admin, email, e.client_name ?? existing?.client_name ?? email)
  }

  // ── Teilnahme anlegen oder aktualisieren ────────────────────────────
  const updates: Record<string, unknown> = {}
  for (const key of ENROLLMENT_FIELDS) {
    if (key in e && e[key] !== undefined) updates[key] = e[key] === '' ? null : e[key]
  }
  if (email) updates.client_email = email
  if (profileId) updates.profile_id = profileId
  if (updates.starts_at) updates.starts_at = String(updates.starts_at).slice(0, 10)
  if (updates.ends_at) updates.ends_at = String(updates.ends_at).slice(0, 10)

  let enrollment: Enrollment
  let created = false
  if (existing) {
    if (Object.keys(updates).length) {
      const { data, error } = await admin.from('coaching_enrollments').update(updates).eq('id', existing.id).select().single()
      if (error) throw new Error(error.message)
      enrollment = data as Enrollment
    } else {
      enrollment = existing
    }
  } else {
    const insert: Record<string, unknown> = {
      program_key: 'coaching_1zu1',
      status: 'active',
      world_mode: 'program_only',
      ...updates,
      client_name: (e.client_name ?? '').trim(),
      profile_id: profileId,
    }
    if (!insert.ends_at && insert.starts_at) {
      const d = new Date(insert.starts_at as string); d.setFullYear(d.getFullYear() + 1)
      insert.ends_at = d.toISOString().slice(0, 10)
    }
    const { data, error } = await admin.from('coaching_enrollments').insert(insert).select().single()
    if (error) throw new Error(error.message)
    enrollment = data as Enrollment
    created = true
    await logEvent(admin, { enrollment_id: enrollment.id, kind: 'note', body: 'Teilnahme per Import angelegt', author_name: author })
  }

  const { data: programRow } = await admin.from('coaching_programs').select('*').eq('key', enrollment.program_key).maybeSingle()
  const program = (programRow as Program | null) ?? null

  // ── Meilensteine ────────────────────────────────────────────────────
  const { data: msRows } = await admin.from('coaching_milestones').select('*').eq('enrollment_id', enrollment.id)
  const milestones: Milestone[] = (msRows ?? []) as Milestone[]
  const findMs = (kind: MilestoneKind, number: number) => milestones.find((m) => m.kind === kind && m.number === number) ?? null
  let msCount = 0

  for (const m of payload.milestones ?? []) {
    const current = findMs(m.kind, m.number)
    const fields: Record<string, unknown> = {}
    for (const k of ['title', 'goal', 'success_criterion', 'status', 'summary', 'decisions', 'done_items', 'open_items', 'bring_along', 'recording_url', 'recap_url', 'meeting_url'] as const) {
      if (m[k] !== undefined) fields[k] = m[k] === '' ? null : m[k]
    }
    if (m.scheduled_at !== undefined) fields.scheduled_at = isoOrNull(m.scheduled_at)

    if (current) {
      const prevDate = current.scheduled_at
      if (fields.scheduled_at && current.status === 'planned' && !fields.status) fields.status = 'scheduled'
      const { data, error } = await admin.from('coaching_milestones').update(fields).eq('id', current.id).select().single()
      if (error) throw new Error(error.message)
      const next = data as Milestone
      Object.assign(current, next)
      if ('scheduled_at' in fields && prevDate !== next.scheduled_at) {
        await logEvent(admin, {
          enrollment_id: enrollment.id, kind: 'schedule_change', client_visible: true, author_name: author,
          body: `${next.title}: ${prevDate ? fmt(prevDate) : 'offen'} → ${next.scheduled_at ? fmt(next.scheduled_at) : 'offen'}${m.change_reason ? ` · Grund: ${m.change_reason}` : ''}`,
          payload: { milestone_id: next.id, from: prevDate, to: next.scheduled_at },
        })
        if (m.with_cadence !== false) {
          await admin.from('coaching_tasks').delete().eq('milestone_id', next.id).eq('assignee', 'coach').eq('kind', 'cadence').eq('status', 'open')
          await createCoachCadenceTasks(admin, program, next)
        }
      }
      if (current.status !== 'done' && next.status === 'done') {
        await logEvent(admin, { enrollment_id: enrollment.id, kind: 'milestone_done', body: next.title, payload: { milestone_id: next.id }, client_visible: true, author_name: author })
      }
    } else {
      const maxSort = milestones.reduce((mx, x) => Math.max(mx, x.sort_order), 0)
      const insert = {
        enrollment_id: enrollment.id,
        kind: m.kind,
        number: m.number,
        title: m.title ?? defaultTitle(m.kind, m.number),
        status: fields.status ?? (fields.scheduled_at ? 'scheduled' : 'planned'),
        sort_order: sortFor(m.kind, m.number, maxSort),
        ...fields,
      }
      const { data, error } = await admin.from('coaching_milestones').insert(insert).select().single()
      if (error) throw new Error(error.message)
      const next = data as Milestone
      milestones.push(next)
      if (m.with_cadence !== false && next.status !== 'done' && next.status !== 'cancelled') {
        await createCoachCadenceTasks(admin, program, next)
      }
      if (next.status === 'done') {
        await logEvent(admin, { enrollment_id: enrollment.id, kind: 'milestone_done', body: next.title, payload: { milestone_id: next.id }, client_visible: true, author_name: author })
      }
    }
    msCount++
  }

  const resolveRef = (ref: string | null | undefined): string | null => {
    const r = parseRef(ref)
    return r ? findMs(r.kind, r.number)?.id ?? null : null
  }

  // ── Workflows ───────────────────────────────────────────────────────
  const { data: goalRows } = await admin.from('coaching_goals').select('*').eq('enrollment_id', enrollment.id)
  const goals: Goal[] = (goalRows ?? []) as Goal[]
  let goalCount = 0
  for (const g of payload.goals ?? []) {
    if (!g.title?.trim()) continue
    const current = goals.find((x) => norm(x.title) === norm(g.title))
    const fields: Record<string, unknown> = {}
    for (const k of ['description', 'status', 'status_note', 'baseline', 'result'] as const) if (g[k] !== undefined) fields[k] = g[k] === '' ? null : g[k]
    if (g.milestone_ref !== undefined) fields.milestone_id = resolveRef(g.milestone_ref)
    if (current) {
      if (fields.status && fields.status !== current.status) {
        fields.stuck_since = fields.status === 'stuck' ? (current.stuck_since ?? new Date().toISOString()) : null
        await logEvent(admin, { enrollment_id: enrollment.id, kind: 'plan_change', client_visible: true, author_name: author, body: `Workflow „${current.title}“: ${current.status} → ${fields.status}`, payload: { goal_id: current.id } })
      }
      if (Object.keys(fields).length) {
        const { error } = await admin.from('coaching_goals').update(fields).eq('id', current.id)
        if (error) throw new Error(error.message)
      }
    } else {
      const maxSort = goals.reduce((mx, x) => Math.max(mx, x.sort_order), 0)
      const { data, error } = await admin.from('coaching_goals').insert({ enrollment_id: enrollment.id, title: g.title.trim(), status: 'planned', sort_order: maxSort + 10, ...fields }).select().single()
      if (error) throw new Error(error.message)
      goals.push(data as Goal)
    }
    goalCount++
  }

  // ── Aufgaben ────────────────────────────────────────────────────────
  const { data: taskRows } = await admin.from('coaching_tasks').select('*').eq('enrollment_id', enrollment.id)
  const tasks: Task[] = (taskRows ?? []) as Task[]
  let taskCount = 0
  for (const t of payload.tasks ?? []) {
    if (!t.title?.trim()) continue
    const milestoneId = t.milestone_ref !== undefined ? resolveRef(t.milestone_ref) : null
    const current = tasks.find((x) => norm(x.title) === norm(t.title) && (x.milestone_id ?? null) === (milestoneId ?? x.milestone_id ?? null))
    const fields: Record<string, unknown> = {}
    for (const k of ['description', 'instructions', 'copy_prompt', 'link_url', 'assignee', 'kind', 'status'] as const) if (t[k] !== undefined) fields[k] = t[k] === '' ? null : t[k]
    if (t.due_at !== undefined) fields.due_at = isoOrNull(t.due_at)
    if (t.milestone_ref !== undefined) fields.milestone_id = milestoneId
    if (fields.status === 'done') fields.completed_at = new Date().toISOString()
    if (current) {
      if (Object.keys(fields).length) {
        const { error } = await admin.from('coaching_tasks').update(fields).eq('id', current.id)
        if (error) throw new Error(error.message)
      }
    } else {
      const maxSort = tasks.reduce((mx, x) => Math.max(mx, x.sort_order), 0)
      const { data, error } = await admin.from('coaching_tasks').insert({ enrollment_id: enrollment.id, title: t.title.trim(), assignee: 'client', kind: 'homework', status: 'open', sort_order: maxSort + 10, ...fields }).select().single()
      if (error) throw new Error(error.message)
      tasks.push(data as Task)
    }
    taskCount++
  }

  // ── Material ────────────────────────────────────────────────────────
  const { data: matRows } = await admin.from('coaching_materials').select('*').eq('enrollment_id', enrollment.id)
  const materials: Material[] = (matRows ?? []) as Material[]
  let matCount = 0
  for (const m of payload.materials ?? []) {
    if (!m.title?.trim()) continue
    const current = materials.find((x) => norm(x.title) === norm(m.title))
    const fields: Record<string, unknown> = {}
    for (const k of ['kind', 'description', 'version', 'external_url', 'instructions', 'visibility'] as const) if (m[k] !== undefined) fields[k] = m[k] === '' ? null : m[k]
    if (m.milestone_ref !== undefined) fields.milestone_id = resolveRef(m.milestone_ref)
    if (current) {
      const becameVisible = fields.visibility === 'client' && current.visibility !== 'client'
      if (Object.keys(fields).length) {
        if (fields.version && fields.version !== current.version) fields.first_opened_at = null
        const { error } = await admin.from('coaching_materials').update(fields).eq('id', current.id)
        if (error) throw new Error(error.message)
      }
      if (becameVisible) await logEvent(admin, { enrollment_id: enrollment.id, kind: 'material_added', body: `${current.title} freigegeben`, client_visible: true, author_name: author })
    } else {
      const { data, error } = await admin.from('coaching_materials').insert({ enrollment_id: enrollment.id, title: m.title.trim(), kind: 'document', visibility: 'internal', ...fields }).select().single()
      if (error) throw new Error(error.message)
      const next = data as Material
      materials.push(next)
      await logEvent(admin, { enrollment_id: enrollment.id, kind: 'material_added', body: next.title, payload: { material_id: next.id }, client_visible: next.visibility === 'client', author_name: author })
    }
    matCount++
  }

  // ── Ereignisse (Verlauf, Stimmung) ──────────────────────────────────
  let evCount = 0
  for (const ev of payload.events ?? []) {
    if (!ev.kind) continue
    const createdAt = isoOrNull(ev.created_at) ?? new Date().toISOString()
    const minute = createdAt.slice(0, 16)
    const { data: dupe } = await admin.from('coaching_events').select('id, created_at').eq('enrollment_id', enrollment.id).eq('kind', ev.kind).eq('body', ev.body ?? null).gte('created_at', `${minute}:00`).lt('created_at', `${minute}:59.999`).limit(1)
    if (dupe && dupe.length) continue
    const { error } = await admin.from('coaching_events').insert({
      enrollment_id: enrollment.id,
      kind: ev.kind,
      body: ev.body ?? null,
      mood_score: ev.mood_score ?? null,
      payload: ev.payload ?? {},
      client_visible: ev.kind === 'mood' ? false : (ev.client_visible ?? false),
      author_name: author,
      created_at: createdAt,
    })
    if (error) throw new Error(error.message)
    evCount++
  }

  // ── Einladung ───────────────────────────────────────────────────────
  let inviteSent = false
  let inviteError: string | null = null
  if (e.send_invite && email && profileId && !(await getAppSettings()).coachingClientAccess) {
    inviteError = 'Kunden-Zugang ist aus (Schalter im Cockpit). Einladung nicht verschickt.'
  } else if (e.send_invite && email && profileId) {
    const res = await sendCoachingInviteEmail(admin, email, { firstName: enrollment.client_name.split(' ')[0], coachName: enrollment.coach_name })
    if (res.ok) {
      inviteSent = true
      await admin.from('coaching_enrollments').update({ invited_at: new Date().toISOString() }).eq('id', enrollment.id)
      await logEvent(admin, { enrollment_id: enrollment.id, kind: 'invite_sent', body: email, author_name: author })
    } else {
      inviteError = res.error
    }
  }

  return {
    enrollment_id: enrollment.id,
    created_enrollment: created,
    profile_id: profileId,
    counts: { goals: goalCount, milestones: msCount, tasks: taskCount, materials: matCount, events: evCount },
    invite_sent: inviteSent,
    invite_error: inviteError,
    dashboard_url: `${baseUrl}/dashboard/coaching`,
    cockpit_url: `${baseUrl}/admin/coaching/${enrollment.id}`,
  }
}

function fmt(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })} · ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
}

function defaultTitle(kind: MilestoneKind, number: number): string {
  if (kind === 'kickoff') return 'Kickoff'
  if (kind === 'call') return `Call ${number}`
  if (kind === 'checkin') return `Tag-${number} Check-in`
  return `Monat ${number}`
}

/** Feste Reihenfolge: Kickoff, Calls, Check-ins, Monate. */
function sortFor(kind: MilestoneKind, number: number, maxSort: number): number {
  if (kind === 'kickoff') return 0
  if (kind === 'call') return number * 10
  if (kind === 'checkin') return 1000 + number
  if (kind === 'month') return 2000 + number
  return maxSort + 10
}
