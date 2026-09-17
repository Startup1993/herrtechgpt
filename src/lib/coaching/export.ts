import type { SupabaseClient } from '@supabase/supabase-js'
import { getEnrollmentAdmin } from './queries'
import { computeProgress, derivePhase, deriveSignals, nextMilestone, lastDoneMilestone } from './derive'
import type { Enrollment } from './types'

export interface ExportQuery {
  id?: string | null
  email?: string | null
  name?: string | null
  since?: string | null
}

/** Kompakte Liste aller Teilnahmen, für Plugin und Connector. */
export async function listEnrollmentsCompact(admin: SupabaseClient) {
  const { data } = await admin
    .from('coaching_enrollments')
    .select('id, client_name, client_email, company, coach_name, status, world_mode, track, starts_at, invited_at, last_client_seen_at')
    .order('status')
    .order('created_at', { ascending: false })
  return { enrollments: data ?? [] }
}

/** Eine Teilnahme komplett (Meilensteine, Aufgaben, Workflows, Material, Verlauf) plus abgeleitete Werte. */
export async function exportEnrollment(admin: SupabaseClient, q: ExportQuery) {
  const email = q.email?.trim().toLowerCase()
  const name = q.name?.trim()
  let enrollmentId = q.id?.trim() || null
  if (!enrollmentId) {
    if (!email && !name) return null
    let query = admin.from('coaching_enrollments').select('id').order('created_at', { ascending: false }).limit(1)
    query = email ? query.eq('client_email', email) : query.ilike('client_name', `%${name}%`)
    const { data } = await query.maybeSingle()
    enrollmentId = (data as Pick<Enrollment, 'id'> | null)?.id ?? null
  }
  if (!enrollmentId) return null

  const bundle = await getEnrollmentAdmin(enrollmentId)
  if (!bundle) return null

  const events = q.since ? bundle.events.filter((e) => new Date(e.created_at).getTime() >= new Date(q.since as string).getTime()) : bundle.events

  return {
    ...bundle,
    events,
    derived: {
      phase: derivePhase(bundle.enrollment, bundle.milestones),
      progress: computeProgress(bundle.milestones, bundle.tasks),
      next_milestone: nextMilestone(bundle.milestones),
      last_done_milestone: lastDoneMilestone(bundle.milestones),
      signals: deriveSignals(bundle.enrollment, bundle.milestones, bundle.tasks, bundle.events),
    },
  }
}
