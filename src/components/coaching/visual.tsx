import type { Milestone } from '@/lib/coaching/types'
import { relativeDays, fmtDate } from '@/lib/coaching/derive'

/** Farbton pro Name, damit ein Kunde überall gleich aussieht. */
export function hueFor(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}

export function initials(name: string): string {
  const parts = name.replace(/^Dr\.\s*/i, '').trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

export function Avatar({ name, size = 32, ring }: { name: string; size?: number; ring?: 'bad' | 'warn' | 'ok' }) {
  const h = hueFor(name)
  const ringClass = ring === 'bad' ? 'ring-2 ring-danger' : ring === 'warn' ? 'ring-2 ring-warning' : ring === 'ok' ? 'ring-2 ring-success' : ''
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full font-bold select-none ${ringClass}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38), background: `hsl(${h} 70% 50% / 0.18)`, color: `hsl(${h} 70% 42%)` }}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

/** Fortschrittsring. value 0..1 */
export function Ring({ value, size = 44, stroke = 5, tone = 'primary', children }: { value: number; size?: number; stroke?: number; tone?: 'primary' | 'ok' | 'warn' | 'bad'; children?: React.ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  const color = tone === 'ok' ? 'var(--ht-success)' : tone === 'warn' ? 'var(--ht-warning)' : tone === 'bad' ? 'var(--ht-danger)' : 'var(--ht-primary)'
  return (
    <span className="relative inline-grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ht-border)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * v} ${c}`} style={{ transition: 'stroke-dasharray .4s ease' }} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-bold tabular-nums text-foreground">{children}</span>
    </span>
  )
}

/** Der 4-Wochen-Weg als Leiste: erledigt, jetzt, offen. */
export function PhaseStepper({ milestones, nextId, size = 'md' }: { milestones: Milestone[]; nextId: string | null; size?: 'sm' | 'md' }) {
  const list = milestones.filter((m) => m.kind !== 'month' && m.status !== 'cancelled')
  if (list.length === 0) return null
  const idx = list.findIndex((m) => m.id === nextId)
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${list.length}, minmax(0, 1fr))` }}>
      {list.map((m, i) => {
        const done = m.status === 'done'
        const isNext = m.id === nextId
        const future = !done && !isNext && (idx === -1 || i > idx)
        return (
          <div key={m.id} className="min-w-0" title={`${m.title}${m.scheduled_at ? ` · ${fmtDate(m.scheduled_at, 'datetime')}` : ''}`}>
            <div className={`${size === 'sm' ? 'h-1.5' : 'h-2'} rounded-full ${done ? 'bg-success' : isNext ? 'bg-primary shadow-[0_0_0_3px_var(--ht-primary-light)]' : 'bg-border'} ${isNext ? 'animate-pulse' : ''}`} />
            {size === 'md' && (
              <div className="mt-1.5 min-w-0">
                <div className={`text-[11px] font-semibold truncate ${isNext ? 'text-primary' : done ? 'text-foreground' : 'text-muted'}`}>{shortTitle(m)}</div>
                <div className={`text-[10px] font-mono truncate ${future ? 'text-muted-light' : 'text-muted'}`}>
                  {m.scheduled_at ? (isNext ? relativeDays(m.scheduled_at) : fmtDate(m.scheduled_at)) : 'offen'}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function shortTitle(m: Pick<Milestone, 'kind' | 'number' | 'title'>): string {
  if (m.kind === 'kickoff') return 'Kickoff'
  if (m.kind === 'call') return `Call ${m.number}`
  if (m.kind === 'checkin') return `Tag ${m.number}`
  return m.title.split(' · ')[0]
}

/** Fünf Punkte für die Stimmung. */
export function MoodDots({ score, size = 8 }: { score: number | null; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={score ? `Stimmung ${score} von 5` : 'keine Stimmung erfasst'}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={`block rounded-full ${score && n <= score ? (score <= 2 ? 'bg-danger' : score === 3 ? 'bg-warning' : 'bg-success') : 'bg-border'}`} style={{ width: size, height: size }} />
      ))}
    </span>
  )
}

/** Großer Countdown fürs Kunden-Cockpit. */
export function Countdown({ at, title, meetingUrl }: { at: string | null; title: string | null; meetingUrl?: string | null }) {
  if (!at) {
    return (
      <div className="rounded-2xl border border-danger/40 bg-danger/5 px-5 py-4">
        <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-danger">Nächster Call</div>
        <div className="text-2xl font-extrabold text-danger mt-1">Termin fehlt</div>
        <div className="text-xs text-muted mt-0.5">{title ?? 'nächster Meilenstein'} hat kein Datum</div>
      </div>
    )
  }
  const d = new Date(at)
  const rel = relativeDays(at)
  const soon = rel === 'heute' || rel === 'morgen'
  return (
    <div className={`rounded-2xl border px-5 py-4 ${soon ? 'border-primary/50 bg-primary/10' : 'border-border bg-surface'}`}>
      <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-primary">{title ?? 'Nächster Call'}</div>
      <div className="text-2xl font-extrabold text-foreground mt-1 leading-tight">{rel}</div>
      <div className="text-sm text-muted mt-0.5 font-mono">{d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })} · {d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
      {meetingUrl && <a href={meetingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline">Meeting öffnen</a>}
    </div>
  )
}
