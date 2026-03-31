import { AuthForm } from '@/components/auth-form'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-surface p-8 rounded-2xl shadow-sm border border-border w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Herr Tech" className="h-8 w-auto mx-auto" />
          <p className="text-muted mt-2">Erstell dein Konto</p>
        </div>

        <div className="flex justify-center">
          <AuthForm mode="signup" />
        </div>

        <p className="text-center text-sm text-muted mt-6">
          Bereits ein Konto?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  )
}
