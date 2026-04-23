'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight } from 'lucide-react'

export function WelcomeScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function start() {
    setLoading(true)
    try {
      await fetch('/api/welcome/complete', { method: 'POST' })
    } catch {
      // Auch bei API-Fehler weiterleiten — der Screen skippt beim Re-Visit dann halt nicht,
      // aber wir wollen den User nicht hier festhängen lassen.
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="min-h-screen flex flex-col">
        <header className="px-6 sm:px-10 py-6">
          <img src="/logo.png" alt="Herr Tech" className="h-7 w-auto" />
        </header>

        <main className="flex-1 flex items-center justify-center px-6 sm:px-10 py-12">
          <div className="w-full max-w-3xl">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-primary mb-6">
              Willkommen
            </p>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
              Du bist drin. <span className="text-primary">Willkommen in der Herr Tech World.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted leading-relaxed mb-10 max-w-2xl">
              Kein Tool-Dschungel. Kein fünftes Abo. Alles an einem Ort. Nimm dir 30 Sekunden und
              schau dich um — oder lass dich direkt von einem der Coaches starten.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <FeatureCard
                emoji="🎬"
                title="KI Toolbox"
                text="Video Creator, Editor & Karussell-Generator. Spart dir Stunden."
              />
              <FeatureCard
                emoji="🤖"
                title="6 KI-Coaches"
                text="Content, Funnel, Mindset, Prompts, Business. Antworten wie Herr Tech."
              />
              <FeatureCard
                emoji="🎓"
                title="Classroom"
                text="Alle Lern-Module an einem Ort. Starte mit dem Lernpfad."
              />
            </div>

            <button
              onClick={start}
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-base transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Los geht's
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </main>

        <footer className="px-6 sm:px-10 py-8 text-center text-xs text-muted">
          © Herr Tech · Powered by Claude
        </footer>
      </div>
    </div>
  )
}

function FeatureCard({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="text-2xl mb-2">{emoji}</div>
      <div className="font-semibold text-foreground mb-1">{title}</div>
      <div className="text-sm text-muted leading-relaxed">{text}</div>
    </div>
  )
}
