import Link from 'next/link'
import { Lock, ChevronLeft, Sparkles } from 'lucide-react'

export default function PremiumGate({ currentTier }: { currentTier: string }) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/ki-toolbox"
          className="text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">KI Video Creator</h1>
      </div>

      <div className="card-static p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-950/30 text-purple-500 flex items-center justify-center mx-auto mb-4">
          <Lock size={28} />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Nur für Premium-Mitglieder
        </h2>
        <p className="text-sm text-muted mb-6">
          Der KI Video Creator ist ein Premium-Feature. Du bist aktuell auf{' '}
          <span className="font-semibold text-foreground">{currentTier}</span>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="btn-ghost border border-border">
            Zurück zum Dashboard
          </Link>
          <Link href="/dashboard/account" className="btn-primary">
            <Sparkles size={14} />
            Auf Premium upgraden
          </Link>
        </div>
      </div>
    </div>
  )
}
