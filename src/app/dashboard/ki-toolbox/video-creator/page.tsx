'use client'

import { useState } from 'react'
import { Sparkles, Loader2, ChevronLeft, Video, Image, Wand2, RotateCcw } from 'lucide-react'
import Link from 'next/link'

interface Scene {
  id: string
  index: number
  title: string
  description: string
  voiceover: string
  imagePrompt: string
  durationSeconds: number
  status: 'pending' | 'done'
}

type Step = 'prompt' | 'generating' | 'scenes' | 'error'

export default function VideoCreatorPage() {
  const [step, setStep] = useState<Step>('prompt')
  const [prompt, setPrompt] = useState('')
  const [scenes, setScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setStep('generating')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/video-creator/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, sceneCount: 6 }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Generierung fehlgeschlagen')
      const data = await res.json()
      setScenes(data.scenes)
      setStep('scenes')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const totalDuration = scenes.reduce((sum, s) => sum + (s.durationSeconds ?? 5), 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/ki-toolbox" className="text-muted hover:text-foreground transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">KI Video Creator</h1>
          <p className="text-sm text-muted">Beschreibe dein Video → KI erstellt Szenen-Skript</p>
        </div>
      </div>

      {/* Step: Prompt */}
      {step === 'prompt' && (
        <div className="space-y-6">
          <div className="card-static p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-purple-50 dark:bg-purple-950/30 text-purple-500 flex items-center justify-center">
                <Wand2 size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Video beschreiben</h2>
                <p className="text-xs text-muted">Beschreibe, was dein Video zeigen soll. Die KI erstellt ein Szenen-Skript.</p>
              </div>
            </div>

            <textarea
              placeholder="z.B. Ein 30-Sekunden Instagram-Reel über die 5 besten KI-Tools für Content Creator in 2025. Hook am Anfang, CTA am Ende."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-border rounded-[var(--radius-lg)] bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || loading}
              className="btn-primary mt-4 w-full justify-center disabled:opacity-50"
            >
              <Sparkles size={16} />
              Szenen generieren
            </button>
          </div>

          {/* Examples */}
          <div className="card-static p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Beispiel-Prompts</h3>
            <div className="space-y-2">
              {[
                '30-Sekunden Reel: 3 KI-Tools die jeder Creator kennen muss',
                'Erklär-Video: Wie funktioniert ein Sales Funnel in 60 Sekunden',
                'Motivations-Short: Warum die meisten Unternehmer scheitern',
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setPrompt(example)}
                  className="w-full text-left px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-hover rounded-[var(--radius-md)] transition-colors"
                >
                  &quot;{example}&quot;
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step: Generating */}
      {step === 'generating' && (
        <div className="card-static p-12 text-center">
          <Loader2 size={40} className="animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Erstelle Szenen-Skript...</h2>
          <p className="text-sm text-muted">Claude schreibt dein Video-Skript mit 6 Szenen.</p>
        </div>
      )}

      {/* Step: Scenes Review */}
      {step === 'scenes' && scenes.length > 0 && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card-static p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{scenes.length}</div>
              <div className="text-xs text-muted">Szenen</div>
            </div>
            <div className="card-static p-4 text-center">
              <div className="text-2xl font-bold text-primary">{totalDuration}s</div>
              <div className="text-xs text-muted">Gesamtdauer</div>
            </div>
            <div className="card-static p-4 text-center">
              <div className="text-2xl font-bold text-emerald-500">✓</div>
              <div className="text-xs text-muted">Bereit</div>
            </div>
          </div>

          {/* Scene Cards */}
          <div className="space-y-3">
            {scenes.map((scene, i) => (
              <div key={scene.id} className="card-static p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">{scene.title}</h3>
                    <span className="text-xs text-muted">{scene.durationSeconds}s</span>
                  </div>
                </div>

                <div className="space-y-2 ml-11">
                  <div className="flex items-start gap-2">
                    <Video size={14} className="text-muted shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/80">{scene.description}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm shrink-0">🎙</span>
                    <p className="text-sm text-muted italic">&quot;{scene.voiceover}&quot;</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Image size={14} className="text-muted shrink-0 mt-0.5" />
                    <p className="text-xs text-muted font-mono">{scene.imagePrompt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="card-static p-5 text-center">
            <p className="text-sm text-muted mb-3">
              Bild- und Videogenerierung (Gemini + FAL.ai) wird in einem späteren Update aktiviert.
            </p>
            <p className="text-xs text-muted">
              Aktuell: Szenen-Skript exportieren und extern weiterverarbeiten.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => { setStep('prompt'); setScenes([]) }}
              className="btn-ghost border border-border flex-1 justify-center"
            >
              <RotateCcw size={14} />
              Neues Video
            </button>
            <button
              onClick={() => {
                const text = scenes.map((s, i) =>
                  `Szene ${i + 1}: ${s.title} (${s.durationSeconds}s)\nBild: ${s.description}\nVoiceover: "${s.voiceover}"\nImage Prompt: ${s.imagePrompt}`
                ).join('\n\n')
                navigator.clipboard.writeText(text)
              }}
              className="btn-primary flex-1 justify-center"
            >
              Skript kopieren
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {step === 'error' && (
        <div className="card-static p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">⚠️</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Fehler</h2>
          <p className="text-sm text-muted mb-4">{error}</p>
          <button onClick={() => setStep('prompt')} className="btn-primary">
            Nochmal versuchen
          </button>
        </div>
      )}
    </div>
  )
}
