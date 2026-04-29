'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X, Save, AlertTriangle } from 'lucide-react'

type SkoolStatus = 'active' | 'alumni' | 'cancelled'

export type EditMember = {
  id: string
  email: string
  name: string | null
  skool_status: SkoolStatus
  skool_access_expires_at: string | null
}

const STATUS_OPTIONS: { value: SkoolStatus; label: string; hint: string }[] = [
  { value: 'active', label: 'Aktiv', hint: 'Voller Premium-Zugang (Plan S)' },
  { value: 'alumni', label: 'Alumni', hint: 'Nur Classroom (lebenslang)' },
  {
    value: 'cancelled',
    label: 'Refunded',
    hint: 'Kein Zugang — User wollte raus',
  },
]

export function EditMemberModal({
  member,
  onClose,
}: {
  member: EditMember | null
  onClose: () => void
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [status, setStatus] = useState<SkoolStatus>('active')
  const [expiresAt, setExpiresAt] = useState('')

  useEffect(() => {
    if (!member) return
    setName(member.name ?? '')
    setStatus(member.skool_status)
    setExpiresAt(
      member.skool_access_expires_at
        ? new Date(member.skool_access_expires_at).toISOString().slice(0, 10)
        : ''
    )
    setError(null)
  }, [member])

  const showCronWarning = useMemo(() => {
    if (status !== 'active') return false
    if (!expiresAt) return true
    const expiryMs = new Date(expiresAt).getTime()
    if (isNaN(expiryMs)) return true
    return expiryMs < Date.now()
  }, [status, expiresAt])

  if (!member) return null

  function close() {
    if (busy) return
    onClose()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!member) return
    setBusy(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        skool_status: status,
        name: name.trim(),
      }
      if (expiresAt) {
        body.skool_access_expires_at = new Date(expiresAt).toISOString()
      }
      const res = await fetch(`/api/admin/community/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? 'Speichern fehlgeschlagen')
        return
      }
      onClose()
      router.refresh()
    } catch {
      setError('Netzwerk-Fehler')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Mitglied bearbeiten</h2>
            <p className="text-xs text-muted mt-1 break-all">{member.email}</p>
          </div>
          <button
            onClick={close}
            className="p-1 rounded-md hover:bg-surface-hover text-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-muted mb-1 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="—"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs text-muted mb-1 block">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SkoolStatus)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="text-xs text-muted mt-1">
              {STATUS_OPTIONS.find((o) => o.value === status)?.hint}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted mb-1 block">Zugang bis</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {showCronWarning && (
            <div className="flex gap-2 text-xs px-3 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Datum auch anpassen!</strong> „Aktiv" mit abgelaufenem
                oder leerem „Zugang bis" wird vom nächtlichen Cleanup
                automatisch wieder auf <strong>Alumni</strong> gesetzt. Schieb
                das Datum in die Zukunft, sonst war's umsonst.
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm px-3 py-2 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={close}
              disabled={busy}
              className="px-4 py-2 rounded-lg border border-border hover:bg-surface-hover text-sm transition disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
