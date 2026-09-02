'use client'

import { use, useState } from 'react'
import { LogIn } from 'lucide-react'

/**
 * Zwischenseite für Anmelde-Links aus E-Mails.
 *
 * Warum nicht direkt /auth/callback? Mail-Provider (Apple Mail Privacy,
 * Outlook SafeLinks etc.) rufen Links in E-Mails automatisch vorab ab und
 * würden den Einmal-Token dabei verbrauchen — der echte Klick landet dann
 * im Leeren. Diese Seite verifiziert nichts beim Laden; erst der bewusste
 * Button-Klick geht weiter zu /auth/callback.
 *
 * Erwartet token_hash + type (aus dem Supabase-Mail-Template) und reicht
 * sie durch. Fällt auf ?code=… zurück, falls noch alte ConfirmationURL-Mails
 * unterwegs sind (PKCE-Flow, funktioniert nur im anfragenden Browser).
 */
export default function AuthConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = use(searchParams)
  const [loading, setLoading] = useState(false)

  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v

  const tokenHash = first(params.token_hash)
  const type = first(params.type)
  const code = first(params.code)
  const next = first(params.next)
  const providerError = first(params.error_description) ?? first(params.error)

  const callbackParams = new URLSearchParams()
  if (tokenHash && type) {
    callbackParams.set('token_hash', tokenHash)
    callbackParams.set('type', type)
  } else if (code) {
    callbackParams.set('code', code)
  }
  if (next) callbackParams.set('next', next)

  const hasValidParams = callbackParams.has('token_hash') || callbackParams.has('code')

  const handleConfirm = () => {
    setLoading(true)
    window.location.assign(`/auth/callback?${callbackParams.toString()}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-surface p-8 rounded-2xl shadow-sm border border-border w-full max-w-md text-center">
        <img src="/logo.png" alt="Herr Tech" className="h-8 w-auto mx-auto" />

        {hasValidParams && !providerError ? (
          <>
            <h1 className="text-foreground font-semibold mt-4">Fast geschafft</h1>
            <p className="text-sm text-muted mt-2">
              Klick auf den Button, um dich bei Herr Tech World anzumelden.
            </p>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="mt-6 w-full py-2.5 px-4 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              {loading ? 'Anmeldung läuft…' : 'Jetzt anmelden'}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-foreground font-semibold mt-4">Link ungültig</h1>
            <p className="text-sm text-muted mt-2">
              Dieser Anmelde-Link ist abgelaufen oder unvollständig. Fordere
              einfach einen neuen an — das dauert nur einen Moment.
            </p>
            <a
              href="/login"
              className="mt-6 inline-block w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors"
            >
              Neuen Link anfordern
            </a>
          </>
        )}
      </div>
    </div>
  )
}
