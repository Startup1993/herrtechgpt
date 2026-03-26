import { AuthForm } from '@/components/auth-form'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-surface p-8 rounded-2xl shadow-sm border border-border w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            <span>immo</span>
            <span className="text-primary">GPT</span>
          </h1>
          <p className="text-muted mt-2">Erstellen Sie Ihr Konto</p>
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
