'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, X } from 'lucide-react'

export function AddMemberModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Default: 1 Jahr ab heute (yyyy-mm-dd)
  const defaultExpiry = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().slice(0, 10)
  })()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'active' | 'alumni'>('active')
  const [expiresAt, setExpiresAt] = useState(defaultExpiry)

  function reset() {
    setEmail('')
    setName('')
    setStatus('active')
    setExpiresAt(defaultExpiry)
    setError(null)
  }

  function close() {
    if (busy) return
    setOpen(false)
    reset()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/community/manual-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          skool_status: status,
          skool_access_expires_at: new Date(expiresAt).toISOString(),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? 'Fehler beim Anlegen')
        return
      }
      reset()
      setOpen(false)
      router.refresh()
    } catch {
      setError('Netzwerk-Fehler')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-surface-hover text-foreground text-sm transition"
      >
        <Plus className="w-4 h-4" />
        Manuell hinzufügen
      </button>

      {open && (
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
                <h2 className="text-lg font-bold text-foreground">
                  Mitglied manuell hinzufügen
                </h2>
                <p className="text-xs text-muted mt-1">
                  Für Skool-Mitglieder ohne Stripe-Kauf (Admins, Free-User, manuell vergebene Zugänge).
                </p>
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
                <label className="text-xs text-muted mb-1 block">E-Mail *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@beispiel.de"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Name (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Max Mustermann"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'alumni')}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="active">Aktiv</option>
                    <option value="alumni">Alumni</option>
                  </select>
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
              </div>

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
                  disabled={busy || !email.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Hinzufügen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
