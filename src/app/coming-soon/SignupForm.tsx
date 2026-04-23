'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || status === 'loading') return

    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/newsletter/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data?.error ?? 'Irgendwas ist schiefgelaufen. Versuch es gleich nochmal.')
        return
      }
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Netzwerk-Fehler. Versuch es gleich nochmal.')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-start gap-4 py-2">
        <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--ht-primary-light)] flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="font-semibold text-foreground mb-1">Du bist dabei.</div>
          <div className="text-sm text-muted leading-relaxed">
            Wir melden uns bei dir, sobald die Herr Tech World öffnet. Dein Zugang kommt per
            E-Mail.
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium text-foreground mb-2">
          Trag dich ein und sei einer der Ersten
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="deine@email.de"
          disabled={status === 'loading'}
          className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60"
        />
      </label>

      <button
        type="submit"
        disabled={status === 'loading' || !email}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Wird gesendet…
          </>
        ) : (
          'Ich will dabei sein'
        )}
      </button>

      {status === 'error' && (
        <p className="text-sm text-red-500">{errorMsg}</p>
      )}

      <p className="text-xs text-muted leading-relaxed">
        Wir nutzen deine E-Mail ausschließlich, um dir Bescheid zu geben, wenn die Plattform öffnet.
        Kein Spam. Abmeldung jederzeit möglich.
      </p>
    </form>
  )
}
