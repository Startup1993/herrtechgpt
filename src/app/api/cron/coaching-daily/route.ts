/**
 * Daily Cron: Coaching-Digest an Slack (07:30 Berlin, 05:30 UTC).
 *
 * Pro Coach ein Block: was heute fällig ist (Coach-Cadence, Zusagen),
 * Signale (überfällig, Blocker, kein Login, Termin fehlt), Calls in den
 * nächsten 48 Stunden, neue Kunden-Nachrichten der letzten 24 Stunden.
 * Kein Kunden-Kontakt. Schreibt nichts, liest nur.
 *
 * Auth: Vercel-Cron via Authorization-Header, manuell via ?secret=
 */

import { NextRequest, NextResponse } from 'next/server'
import { listEnrollmentsAdmin } from '@/lib/coaching/queries'
import { derivePhase, deriveSignals, fmtDate, nextMilestone } from '@/lib/coaching/derive'
import { postCoachingSlack, slackConfigured, mrkdwnEscape as esc } from '@/lib/coaching/slack'
import { PRODUCTION_URL } from '@/lib/urls'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DAY = 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = req.nextUrl.searchParams.get('secret')
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isManual = !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET
  if (!isVercelCron && !isManual) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!slackConfigured()) {
    return NextResponse.json({ skipped: true, reason: 'SLACK_COACHING_WEBHOOK_URL nicht gesetzt' })
  }

  const now = new Date()
  const bundles = (await listEnrollmentsAdmin()).filter((b) => b.enrollment.status === 'active')
  const base = PRODUCTION_URL

  const byCoach = new Map<string, string[]>()
  let dueTotal = 0
  let attention = 0

  for (const b of bundles) {
    const e = b.enrollment
    const coach = e.coach_name ?? 'Team'
    const lines: string[] = []
    const phase = derivePhase(e, b.milestones).short
    const signals = deriveSignals(e, b.milestones, b.tasks, b.events, now).filter((s) => s.level !== 'ok' && s.label !== 'noch nicht eingeladen' && s.label !== 'kein World-Zugang')
    const next = nextMilestone(b.milestones)
    const due = b.tasks
      .filter((t) => t.assignee === 'coach' && t.status === 'open' && t.due_at && new Date(t.due_at).getTime() <= now.getTime() + DAY)
      .sort((a, c) => new Date(a.due_at!).getTime() - new Date(c.due_at!).getTime())
    const newMsgs = b.events.filter((ev) => (ev.kind === 'client_blocker' || ev.kind === 'client_win') && now.getTime() - new Date(ev.created_at).getTime() < DAY)
    const hasBad = signals.some((s) => s.level === 'bad')
    if (hasBad) attention++
    dueTotal += due.length

    const head = `${hasBad ? '🔴' : due.length ? '🟡' : '🟢'} *<${base}/admin/coaching/${e.id}|${esc(e.client_name)}>* · ${esc(phase)}` +
      (next?.scheduled_at ? ` · nächster Call ${fmtDate(next.scheduled_at, 'datetime')}` : next ? ' · nächster Termin fehlt' : '')
    lines.push(head)
    if (signals.length) lines.push(`   Signale: ${signals.map((s) => esc(s.label)).join(' · ')}`)
    for (const t of due) {
      const overdue = new Date(t.due_at!).getTime() < now.getTime() - 60 * 60 * 1000
      lines.push(`   ${overdue ? '⚠️' : '☐'} ${esc(t.title)} _(${fmtDate(t.due_at, 'datetime')})_`)
    }
    for (const m of newMsgs) {
      lines.push(`   ${m.kind === 'client_blocker' ? '🆘' : '🎉'} Kunde: „${esc((m.body ?? '').slice(0, 140))}${(m.body ?? '').length > 140 ? '…' : ''}“`)
    }
    if (!signals.length && !due.length && !newMsgs.length) lines.push('   nichts offen')

    const arr = byCoach.get(coach) ?? []
    arr.push(lines.join('\n'))
    byCoach.set(coach, arr)
  }

  const dateLabel = now.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })
  const header = `*Coaching-Cockpit · ${dateLabel}* · ${bundles.length} aktiv · ${dueTotal} fällig · ${attention} ${attention === 1 ? 'Kunde braucht' : 'Kunden brauchen'} dich`
  const sections = [...byCoach.entries()].map(([coach, items]) => `*${esc(coach)}*\n${items.join('\n\n')}`)
  const text = [header, ...sections, `<${base}/admin/coaching|Zum Cockpit>`].join('\n\n')

  const ok = await postCoachingSlack(text)
  return NextResponse.json({ ok, enrollments: bundles.length, due: dueTotal, attention })
}
