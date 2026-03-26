import { AuthForm } from '@/components/auth-form'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-surface p-8 rounded-2xl shadow-sm border border-border w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            <span>immo</span>
            <span className="text-primary">GPT</span>
          </h1>
          <p className="text-muted mt-2">Melden Sie sich an</p>
        </div>

        <div className="flex justify-center">
          <AuthForm mode="login" />
        </div>

        <p className="text-center text-sm text-muted mt-6">
          Noch kein Konto?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  )
}
