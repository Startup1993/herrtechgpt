import type { SupabaseClient } from '@supabase/supabase-js'
import type { Milestone, MilestoneKind, Program } from './types'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

/**
 * Legt zu einem Meilenstein die Coach-Aufgaben aus der Programm-Cadence an
 * (Recap, Mid-Week-Check, Erinnerung, Terminbestätigung, Vorbereitung).
 * Nur wenn ein Termin gesetzt ist, sonst gibt es keine Fälligkeiten.
 */
export async function createCoachCadenceTasks(
  admin: SupabaseClient,
  program: Program | null,
  milestone: Milestone,
) {
  if (!program || !milestone.scheduled_at) return
  if (milestone.kind !== 'call' && milestone.kind !== 'kickoff') return

  const at = new Date(milestone.scheduled_at).getTime()
  const rows: Array<Record<string, unknown>> = []
  let order = 0

  for (const prep of program.template.coach_prep ?? []) {
    rows.push({
      enrollment_id: milestone.enrollment_id,
      milestone_id: milestone.id,
      title: `${prep.title} · ${milestone.title}`,
      assignee: 'coach',
      kind: 'cadence',
      due_at: new Date(at + (prep.offset_days ?? -1) * DAY).toISOString(),
      sort_order: order++,
    })
  }
  for (const step of program.template.coach_cadence ?? []) {
    const offset = (step.offset_days ?? 0) * DAY + (step.offset_hours ?? 0) * HOUR
    rows.push({
      enrollment_id: milestone.enrollment_id,
      milestone_id: milestone.id,
      title: `${step.title} · nach ${milestone.title}`,
      assignee: 'coach',
      kind: 'cadence',
      due_at: new Date(at + offset).toISOString(),
      sort_order: order++,
    })
  }
  if (rows.length) await admin.from('coaching_tasks').insert(rows)
}

/** Nächster freier Vorlagen-Eintrag, der bei dieser Teilnahme noch nicht existiert. */
export function nextTemplateMilestone(program: Program | null, existing: Milestone[]) {
  const list = program?.template.milestones ?? []
  return list.find((t) => !existing.some((m) => m.kind === t.kind && m.number === t.number)) ?? null
}

export function milestoneDefaults(kind: MilestoneKind, number: number): { title: string; goal: string } {
  switch (kind) {
    case 'kickoff': return { title: 'Kickoff', goal: 'Nordstern, Track und die 3 Workflows festmachen' }
    case 'call': return { title: `Call ${number}`, goal: '' }
    case 'checkin': return { title: `Tag-${number} Check-in`, goal: 'Läuft es noch? Wo hakt es?' }
    case 'month': return { title: `Monat ${number}`, goal: '' }
  }
}
