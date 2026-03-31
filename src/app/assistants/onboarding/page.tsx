'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const steps = [
  {
    id: 0,
    title: 'Willkommen bei Herr Tech',
    subtitle: 'Dein persönlicher KI-Workspace ist bereit. Damit ich dir die bestmöglichen Ergebnisse liefern kann, brauche ich kurz ein paar Infos über dich.',
    cta: 'Los geht\'s →',
  },
  {
    id: 1,
    title: 'Wer bist du?',
    subtitle: 'Erzähl mir kurz von dir — dein Hintergrund macht meine Antworten 10x besser.',
    fields: [
      {
        key: 'background',
        label: 'Über dich',
        placeholder: 'z.B. Creator & Online-Unternehmer seit 3 Jahren, Schwerpunkt KI & Produktivität, 700k Follower auf Social Media...',
        rows: 3,
      },
      {
        key: 'market',
        label: 'Deine Nische & Business',
        placeholder: 'z.B. Online-Kurse und Coaching rund um KI & Business. Hauptplattformen: Instagram und YouTube.',
        rows: 3,
      },
    ],
    cta: 'Weiter →',
  },
  {
    id: 2,
    title: 'Fast fertig!',
    subtitle: 'Noch zwei kurze Fragen — dann kann ich dir wirklich gezielt helfen.',
    fields: [
      {
        key: 'target_audience',
        label: 'Deine Zielgruppe',
        placeholder: 'z.B. Ambitionierte Unternehmer & Creator, 25–45 Jahre, die KI nutzen wollen um Zeit zu sparen und ihr Business zu skalieren.',
        rows: 3,
      },
      {
        key: 'offer',
        label: 'Deine Angebote',
        placeholder: 'z.B. KI-Masterkurs (997€), Membership-Community (49€/Monat), 1:1 Strategy-Calls (350€/h).',
        rows: 3,
      },
    ],
    cta: 'Workspace starten 🚀',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    background: '',
    market: '',
    target_audience: '',
    offer: '',
  })

  const currentStep = steps[step]

  const markDone = () => {
    localStorage.setItem('herr_tech_onboarding_done', 'true')
  }

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1)
      return
    }
    // Last step → save and redirect
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({
          background: form.background,
          market: form.market,
          target_audience: form.target_audience,
          offer: form.offer,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }
    markDone()
    router.push('/assistants')
    router.refresh()
  }

  const handleSkip = () => {
    markDone()
    router.push('/assistants')
  }

  return (
    <div className="flex items-center justify-center min-h-full bg-background p-6">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= step ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="text-5xl mb-6">👋</div>
              <h1 className="text-2xl font-bold text-foreground mb-3">
                {currentStep.title}
              </h1>
              <p className="text-muted text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                {currentStep.subtitle}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="w-full px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  {currentStep.cta}
                </button>
                <button
                  onClick={handleSkip}
                  className="text-sm text-muted hover:text-foreground transition-colors py-2"
                >
                  Jetzt überspringen
                </button>
              </div>
            </div>
          )}

          {/* Steps 1 & 2: Form fields */}
          {step > 0 && currentStep.fields && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                {currentStep.title}
              </h2>
              <p className="text-muted text-sm mb-6">{currentStep.subtitle}</p>

              <div className="space-y-5">
                {currentStep.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {field.label}
                    </label>
                    <textarea
                      value={form[field.key as keyof typeof form]}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      rows={field.rows}
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none bg-background text-foreground placeholder:text-muted"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  ← Zurück
                </button>
                <button
                  onClick={handleNext}
                  disabled={saving}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  {saving ? 'Speichere...' : currentStep.cta}
                </button>
              </div>

              <p className="text-center text-xs text-muted mt-4">
                Du kannst das jederzeit unter{' '}
                <span className="text-primary">Wissensbasis</span> anpassen.
              </p>
            </div>
          )}
        </div>

        {step > 0 && (
          <p className="text-center text-xs text-muted mt-4">
            Schritt {step} von {steps.length - 1}
          </p>
        )}
      </div>
    </div>
  )
}
