import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CoachingEvent, Enrollment, Goal, Material, Milestone, Program, Task } from './types'

export const COACHING_BUCKET = 'coaching-files'

export interface EnrollmentBundle {
  enrollment: Enrollment
  program: Program | null
  milestones: Milestone[]
  tasks: Task[]
  goals: Goal[]
  materials: Material[]
  events: CoachingEvent[]
}

/**
 * Lädt die aktive Teilnahme eines Users mit allem, was der Kunde sehen darf.
 * Läuft mit dem User-Client, RLS filtert Coach-Aufgaben, internes Material
 * und interne Ereignisse heraus.
 */
export async function getClientEnrollment(
  supabase: SupabaseClient,
  userId: string,
): Promise<EnrollmentBundle | null> {
  const { data: enrollment } = await supabase
    .from('coaching_enrollments')
    .select('*')
    .eq('profile_id', userId)
    .in('status', ['active', 'paused', 'completed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!enrollment) return null
  return loadBundle(supabase, enrollment as Enrollment, { signUrls: true })
}

/** Nur der schmale Kontext fürs Layout: gibt es eine Teilnahme, welcher Modus? */
export async function getClientCoachingContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ id: string; world_mode: Enrollment['world_mode']; status: Enrollment['status'] } | null> {
  const { data } = await supabase
    .from('coaching_enrollments')
    .select('id, world_mode, status')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as { id: string; world_mode: Enrollment['world_mode']; status: Enrollment['status'] } | null) ?? null
}

/** Admin: eine Teilnahme komplett (inkl. Coach-Aufgaben, internes Material, Stimmung). */
export async function getEnrollmentAdmin(id: string): Promise<EnrollmentBundle | null> {
  const admin = createAdminClient()
  const { data: enrollment } = await admin.from('coaching_enrollments').select('*').eq('id', id).maybeSingle()
  if (!enrollment) return null
  return loadBundle(admin, enrollment as Enrollment, { signUrls: true })
}

/** Admin: alle Teilnahmen mit dem, was die Liste braucht. */
export async function listEnrollmentsAdmin(): Promise<EnrollmentBundle[]> {
  const admin = createAdminClient()
  const { data: enrollments } = await admin
    .from('coaching_enrollments')
    .select('*')
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })
  const rows = (enrollments ?? []) as Enrollment[]
  if (!rows.length) return []
  const ids = rows.map((e) => e.id)
  const [{ data: milestones }, { data: tasks }, { data: goals }, { data: events }, { data: programs }] = await Promise.all([
    admin.from('coaching_milestones').select('*').in('enrollment_id', ids),
    admin.from('coaching_tasks').select('*').in('enrollment_id', ids),
    admin.from('coaching_goals').select('*').in('enrollment_id', ids),
    admin.from('coaching_events').select('*').in('enrollment_id', ids).order('created_at', { ascending: false }).limit(2000),
    admin.from('coaching_programs').select('*'),
  ])
  const programMap = new Map<string, Program>()
  for (const p of (programs ?? []) as Program[]) programMap.set(p.key, p)
  return rows.map((e) => ({
    enrollment: e,
    program: programMap.get(e.program_key) ?? null,
    milestones: ((milestones ?? []) as Milestone[]).filter((m) => m.enrollment_id === e.id),
    tasks: ((tasks ?? []) as Task[]).filter((t) => t.enrollment_id === e.id),
    goals: ((goals ?? []) as Goal[]).filter((g) => g.enrollment_id === e.id),
    materials: [],
    events: ((events ?? []) as CoachingEvent[]).filter((ev) => ev.enrollment_id === e.id),
  }))
}

export async function listPrograms(): Promise<Program[]> {
  const admin = createAdminClient()
  const { data } = await admin.from('coaching_programs').select('*').order('created_at', { ascending: true })
  return (data ?? []) as Program[]
}

async function loadBundle(
  client: SupabaseClient,
  enrollment: Enrollment,
  opts: { signUrls: boolean },
): Promise<EnrollmentBundle> {
  const [{ data: program }, { data: milestones }, { data: tasks }, { data: goals }, { data: materials }, { data: events }] =
    await Promise.all([
      client.from('coaching_programs').select('*').eq('key', enrollment.program_key).maybeSingle(),
      client.from('coaching_milestones').select('*').eq('enrollment_id', enrollment.id).order('sort_order', { ascending: true }),
      client.from('coaching_tasks').select('*').eq('enrollment_id', enrollment.id).order('sort_order', { ascending: true }).order('due_at', { ascending: true }),
      client.from('coaching_goals').select('*').eq('enrollment_id', enrollment.id).order('sort_order', { ascending: true }),
      client.from('coaching_materials').select('*').eq('enrollment_id', enrollment.id).order('created_at', { ascending: false }),
      client.from('coaching_events').select('*').eq('enrollment_id', enrollment.id).order('created_at', { ascending: false }).limit(300),
    ])

  let mats = (materials ?? []) as Material[]
  let ms = (milestones ?? []) as Milestone[]
  if (opts.signUrls) {
    const admin = createAdminClient()
    mats = await Promise.all(
      mats.map(async (m) => ({ ...m, signed_url: await signedUrl(admin, m.storage_path) })),
    )
    ms = await Promise.all(
      ms.map(async (m) => {
        if (!m.recap_storage_path) return m
        const url = await signedUrl(admin, m.recap_storage_path)
        return { ...m, recap_url: url ?? m.recap_url }
      }),
    )
  }

  return {
    enrollment,
    program: (program as Program | null) ?? null,
    milestones: ms,
    tasks: (tasks ?? []) as Task[],
    goals: (goals ?? []) as Goal[],
    materials: mats,
    events: (events ?? []) as CoachingEvent[],
  }
}

export async function signedUrl(admin: SupabaseClient, path: string | null | undefined): Promise<string | null> {
  if (!path) return null
  const { data } = await admin.storage.from(COACHING_BUCKET).createSignedUrl(path, 60 * 60 * 6)
  return data?.signedUrl ?? null
}

/** Schreibt ein Ereignis in den Verlauf (Service-Role, nach Prüfung durch den Aufrufer). */
export async function logEvent(
  admin: SupabaseClient,
  input: {
    enrollment_id: string
    kind: CoachingEvent['kind']
    body?: string | null
    payload?: Record<string, unknown>
    author_profile_id?: string | null
    author_name?: string | null
    mood_score?: number | null
    client_visible?: boolean
  },
) {
  await admin.from('coaching_events').insert({
    enrollment_id: input.enrollment_id,
    kind: input.kind,
    body: input.body ?? null,
    payload: input.payload ?? {},
    author_profile_id: input.author_profile_id ?? null,
    author_name: input.author_name ?? null,
    mood_score: input.mood_score ?? null,
    client_visible: input.client_visible ?? false,
  })
}

/** Markiert, dass der Kunde gerade da war. Höchstens einmal pro Stunde ein Login-Ereignis. */
export async function touchClientSeen(admin: SupabaseClient, enrollment: Enrollment) {
  const now = new Date()
  const last = enrollment.last_client_seen_at ? new Date(enrollment.last_client_seen_at) : null
  const stale = !last || now.getTime() - last.getTime() > 60 * 60 * 1000
  await admin.from('coaching_enrollments').update({ last_client_seen_at: now.toISOString() }).eq('id', enrollment.id)
  if (stale) {
    await logEvent(admin, { enrollment_id: enrollment.id, kind: 'login', author_profile_id: enrollment.profile_id, author_name: enrollment.client_name })
  }
}
