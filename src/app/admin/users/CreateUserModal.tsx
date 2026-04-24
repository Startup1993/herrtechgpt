'use client'

import { useState } from 'react'
import { X, Check, AlertTriangle, Loader2, UserPlus } from 'lucide-react'

type AccessTier = 'basic' | 'alumni' | 'premium'
type Role = 'user' | 'admin'

const TIER_OPTIONS: Array<{ value: AccessTier; label: string; hint: string }> = [
  { value: 'basic',   label: 'Basic',              hint: 'Kein Zugriff auf Chat/Toolbox' },
  { value: 'alumni',  label: 'Alumni',             hint: 'Classroom freigeschaltet' },
  { value: 'premium', label: 'Community (Premium)', hint: 'Voller Zugriff' },
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type CreateResult = {
  success: true
  userId: string
  email: string
  invite_sent: boolean
  invite_error: string | null
}

export function CreateUserModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean
  onClose: () => void
  onDone: () => void
}) {
  const [email, setEmail] = useState('')
  const [tier, setTier] = useState<AccessTier>('premium')
  const [role, setRole] = useState<Role>('user')
  const [sendInvite, setSendInvite] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CreateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function reset() {
    setEmail('')
    setTier('premium')
    setRole('user')
    setSendInvite(true)
    setResult(null)
    setError(null)
  }

  const emailValid = EMAIL_REGEX.test(email.trim().toLowerCase())

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          access_tier: tier,
          role,
          send_invite: sendInvite,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Anlegen fehlgeschlagen')
      } else {
        setResult(data as CreateResult)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleFinish() {
    reset()
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <UserPlus size={18} />
            Nutzer hinzufügen
          </h2>
          <button
            onClick={handleClose}
            className="text-muted hover:text-foreground p-1 rounded-lg hover:bg-surface-secondary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <Check size={18} />
                <span className="font-semibold">Nutzer angelegt</span>
              </div>
              <div className="text-sm text-foreground space-y-1">
                <p><strong>{result.email}</strong> wurde angelegt.</p>
                {result.invite_sent && (
                  <p className="text-green-600">Einladungs-E-Mail wurde versendet.</p>
                )}
                {result.invite_error && (
                  <p className="text-amber-600">Einladung fehlgeschlagen: {result.invite_error}</p>
                )}
                {!result.invite_sent && !result.invite_error && (
                  <p className="text-muted text-xs">
                    Keine Einladung verschickt. Du kannst sie später in der Nutzer-Liste per „Einladung senden" nachholen.
                  </p>
                )}
              </div>
              <button onClick={handleFinish} className="w-full btn-primary mt-4">
                Fertig
              </button>
            </div>
          ) : (
            <>
              {/* E-Mail */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  E-Mail-Adresse *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="max@beispiel.de"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>

              {/* Tier */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Zugangstier
                </label>
                <div className="space-y-2">
                  {TIER_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        tier === opt.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-surface-secondary'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tier"
                        value={opt.value}
                        checked={tier === opt.value}
                        onChange={() => setTier(opt.value)}
                        className="mt-0.5 accent-primary"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{opt.label}</div>
                        <div className="text-xs text-muted">{opt.hint}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rolle */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rolle
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      role === 'user'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-surface text-muted hover:bg-surface-secondary'
                    }`}
                  >
                    Nutzer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      role === 'admin'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-surface text-muted hover:bg-surface-secondary'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Einladung */}
              <div>
                <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-surface-secondary transition-colors">
                  <input
                    type="checkbox"
                    checked={sendInvite}
                    onChange={(e) => setSendInvite(e.target.checked)}
                    className="mt-0.5 accent-primary"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">
                      Einladungs-E-Mail versenden
                    </div>
                    <div className="text-xs text-muted">
                      Nutzer bekommt sofort einen Magic-Link per E-Mail. Ohne Häkchen wird der Nutzer still angelegt — du kannst die Einladung später in der Liste per „Einladung senden" nachholen oder mehrfach erneut verschicken.
                    </div>
                  </div>
                </label>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground rounded-lg"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !emailValid}
                  className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Nutzer anlegen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
