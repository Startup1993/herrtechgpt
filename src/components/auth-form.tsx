'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Mail, Check } from 'lucide-react'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const emailRedirectTo = `${window.location.origin}/auth/callback`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
        // Login: nur existierende Nutzer; Signup: neue Nutzer automatisch anlegen
        shouldCreateUser: mode === 'signup',
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mx-auto">
          <Check className="text-green-600" size={22} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">E-Mail versendet</h3>
          <p className="text-sm text-muted mt-1">
            Wir haben dir einen Login-Link an <strong>{email}</strong> geschickt.
            Klick auf den Link in der E-Mail, um dich anzumelden.
          </p>
        </div>
        <button
          onClick={() => { setSent(false); setEmail('') }}
          className="text-sm text-muted hover:text-foreground underline"
        >
          Andere E-Mail verwenden
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
          E-Mail-Adresse
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="ihre@email.de"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
      >
        <Mail size={16} />
        {loading
          ? 'Link wird versendet…'
          : mode === 'login'
            ? 'Login-Link per E-Mail'
            : 'Konto erstellen per E-Mail'}
      </button>

      <p className="text-xs text-muted text-center leading-relaxed">
        Kein Passwort nötig — wir schicken dir einen einmaligen Login-Link per E-Mail.
      </p>
    </form>
  )
}
