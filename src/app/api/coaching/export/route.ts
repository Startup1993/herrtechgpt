import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEnrollmentAdmin } from '@/lib/coaching/queries'
import { computeProgress, derivePhase, deriveSignals, nextMilestone, lastDoneMilestone } from '@/lib/coaching/derive'
import type { Enrollment } from '@/lib/coaching/types'

/**
 * Lese-Endpunkt für das Plugin (call-vorbereiten, coaching-status):
 * liefert Teilnahme, Meilensteine, alle Aufgaben, Workflows, Material und
 * den Verlauf. Auth wie beim Import. ?email=… | ?id=… | ?name=…
 * Ohne Parameter: Liste aller Teilnahmen (kompakt).
 */
function authorized(request: Request): boolean {
  const secret = process.env.COACHING_IMPORT_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  return token.length > 0 && token === secret
}

export async function GET(request: Request) {
  if (!process.env.COACHING_IMPORT_SECRET) return NextResponse.json({ error: 'COACHING_IMPORT_SECRET ist nicht gesetzt' }, { status: 503 })
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const email = searchParams.get('email')?.trim().toLowerCase()
  const name = searchParams.get('name')?.trim()
  const admin = createAdminClient()

  if (!id && !email && !name) {
    const { data } = await admin.from('coaching_enrollments').select('id, client_name, client_email, company, coach_name, status, world_mode, track, starts_at, invited_at, last_client_seen_at').order('status').order('created_at', { ascending: false })
    return NextResponse.json({ enrollments: data ?? [] })
  }

  let enrollmentId = id
  if (!enrollmentId) {
    let q = admin.from('coaching_enrollments').select('id').order('created_at', { ascending: false }).limit(1)
    q = email ? q.eq('client_email', email) : q.ilike('client_name', `%${name}%`)
    const { data } = await q.maybeSingle()
    enrollmentId = (data as Pick<Enrollment, 'id'> | null)?.id ?? null
  }
  if (!enrollmentId) return NextResponse.json({ error: 'Teilnahme nicht gefunden' }, { status: 404 })

  const bundle = await getEnrollmentAdmin(enrollmentId)
  if (!bundle) return NextResponse.json({ error: 'Teilnahme nicht gefunden' }, { status: 404 })

  const since = searchParams.get('since')
  const events = since ? bundle.events.filter((e) => new Date(e.created_at).getTime() >= new Date(since).getTime()) : bundle.events

  return NextResponse.json({
    ...bundle,
    events,
    derived: {
      phase: derivePhase(bundle.enrollment, bundle.milestones),
      progress: computeProgress(bundle.milestones, bundle.tasks),
      next_milestone: nextMilestone(bundle.milestones),
      last_done_milestone: lastDoneMilestone(bundle.milestones),
      signals: deriveSignals(bundle.enrollment, bundle.milestones, bundle.tasks, bundle.events),
    },
  })
}
