import { AuthForm } from '@/components/auth-form'

const ERROR_MESSAGES: Record<string, string> = {
  link_invalid:
    'Der Anmelde-Link ist abgelaufen oder wurde schon verwendet. Fordere unten einfach einen neuen an.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const initialError = error ? (ERROR_MESSAGES[error] ?? null) : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-surface p-8 rounded-2xl shadow-sm border border-border w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Herr Tech" className="h-8 w-auto mx-auto" />
          <h1 className="text-foreground font-semibold mt-3">Anmelden oder registrieren</h1>
          <p className="text-xs text-muted mt-1">
            Eine Mail, ein Klick — egal ob neu oder alter Hase.
          </p>
        </div>

        <div className="flex justify-center">
          <AuthForm initialError={initialError} />
        </div>
      </div>
    </div>
  )
}
