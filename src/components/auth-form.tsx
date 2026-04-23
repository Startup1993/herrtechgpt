'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Mail, Check } from 'lucide-react'

/**
 * Unified Auth-Form — ein Flow für Login + Signup.
 *
 * Verhalten:
 *   - User gibt Email ein
 *   - Supabase schickt Magic-Link
 *     · Existierender Account → Login-Link
 *     · Neuer Account        → Bestätigungs-Link (Account wird beim Klick aktiviert)
 *   - User merkt den Unterschied nicht
 *
 * Das setzt in Supabase voraus:
 *   Authentication → Providers → Email → "Allow new users to sign up" = ON
 *   UND der spezifische OTP-Signup-Toggle im Email-Provider = ON
 */
export function AuthForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=/welcome`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
        shouldCreateUser: true, // Unified: immer Account anlegen wenn noch keiner da
      },
    })

    setLoading(false)
    if (error) {
      setError(translateError(error.message))
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
            Wir haben dir einen Link an <strong>{email}</strong> geschickt. Klick drauf,
            um dich anzumelden — falls du noch kein Konto hast, legen wir eins für dich an.
          </p>
        </div>
        <button
          onClick={() => {
            setSent(false)
            setEmail('')
          }}
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
        {loading ? 'Link wird versendet…' : 'Magic-Link per E-Mail'}
      </button>

      <p className="text-xs text-muted text-center leading-relaxed">
        Kein Passwort nötig — wir schicken dir einen einmaligen Link per E-Mail.
        Neuer Account oder bestehender Login: Beides funktioniert hier.
      </p>
    </form>
  )
}

/**
 * Übersetzt Supabase-Fehler in verständliches Deutsch.
 * Neue Fehlercodes bei Bedarf hier ergänzen.
 */
function translateError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('signups not allowed')) {
    return (
      'Registrierung per Magic-Link ist in den Supabase-Einstellungen noch nicht aktiviert. ' +
      'Admin: Authentication → Providers → Email → OTP Signups aktivieren.'
    )
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Zu viele Versuche. Bitte ein paar Minuten warten und nochmal probieren.'
  }
  if (m.includes('invalid email')) {
    return 'Diese E-Mail-Adresse sieht nicht korrekt aus. Bitte prüfen.'
  }
  if (m.includes('email not confirmed')) {
    return 'Du hast dein Konto noch nicht bestätigt. Schau in deinen Posteingang.'
  }
  return msg
}
