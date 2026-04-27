'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function ClaimButton({
  token,
  alreadyClaimed,
  email,
}: {
  token: string
  alreadyClaimed: boolean
  email: string
}) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<
    | { type: 'ok'; text: string }
    | { type: 'err'; text: string }
    | null
  >(null)

  async function claim() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/invite/skool/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; redirectTo?: string; error?: string; warning?: string }
        | null
      if (!res.ok) {
        setResult({ type: 'err', text: data?.error ?? 'Aktivierung fehlgeschlagen' })
        setLoading(false)
        return
      }
      if (data?.redirectTo) {
        // Direkter Auto-Login: weiter zu /auth/callback mit token_hash
        setResult({
          type: 'ok',
          text: 'Du wirst eingeloggt — einen Moment …',
        })
        window.location.href = data.redirectTo
        return
      }
      // Fallback ohne redirect (sehr seltener Edge-Case)
      setResult({
        type: 'ok',
        text: `Account aktiviert. Login auf der Anmelde-Seite mit ${email}.`,
      })
      setLoading(false)
    } catch {
      setResult({ type: 'err', text: 'Netzwerk-Fehler, versuch es nochmal.' })
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={claim}
        disabled={loading || result?.type === 'ok'}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {alreadyClaimed ? 'Login-Link schicken' : 'Zugang aktivieren'}
      </button>

      {result && (
        <div
          className={`mt-4 text-sm px-4 py-3 rounded-lg ${
            result.type === 'ok'
              ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
          }`}
        >
          {result.text}
        </div>
      )}
    </div>
  )
}
