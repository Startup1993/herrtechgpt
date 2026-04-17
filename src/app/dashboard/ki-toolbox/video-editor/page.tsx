'use client'

import { useState } from 'react'
import { Upload, FileVideo, Loader2, Scissors, CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { TranscriptSegment, SceneAnalysis } from '@/lib/video/types'

type Step = 'upload' | 'transcribe' | 'analyze' | 'review' | 'error'

export default function VideoEditorPage() {
  const [step, setStep] = useState<Step>('upload')
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([])
  const [pastedText, setPastedText] = useState('')
  const [scenes, setScenes] = useState<SceneAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoTitle, setVideoTitle] = useState('')

  // ── Transkript manuell eingeben (Cloud-kompatibel) ──
  const handleTranscriptSubmit = async () => {
    if (!pastedText.trim()) return

    // Parse pasted text into segments
    const lines = pastedText.trim().split('\n').filter(l => l.trim())
    const segments: TranscriptSegment[] = lines.map((line, i) => {
      // Try to parse timestamps like [0.0s - 3.5s] Text
      const match = line.match(/\[(\d+\.?\d*)s?\s*[-–]\s*(\d+\.?\d*)s?\]\s*(.+)/)
      if (match) {
        return { id: i, start: parseFloat(match[1]), end: parseFloat(match[2]), text: match[3].trim() }
      }
      // Fallback: estimate timestamps
      const avgDuration = 3
      return { id: i, start: i * avgDuration, end: (i + 1) * avgDuration, text: line.trim() }
    })

    setTranscript(segments)
    setStep('analyze')

    // Auto-analyze
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/video-editor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segments, videoTitle }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Analyse fehlgeschlagen')
      const data = await res.json()
      setScenes(data.scenes)
      setStep('review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const keepScenes = scenes.filter(s => !s.suggestedCut)
  const cutScenes = scenes.filter(s => s.suggestedCut)
  const savedTime = cutScenes.reduce((sum, s) => sum + (s.endTime - s.startTime), 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/ki-toolbox" className="text-muted hover:text-foreground transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">KI Video Editor</h1>
          <p className="text-sm text-muted">Transkript einfügen → KI analysiert → Schnittvorschläge</p>
        </div>
      </div>

      {/* Step: Upload / Paste Transcript */}
      {(step === 'upload' || step === 'transcribe') && (
        <div className="space-y-6">
          <div className="card-static p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-blue-50 dark:bg-blue-950/30 text-blue-500 flex items-center justify-center">
                <FileVideo size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Transkript einfügen</h2>
                <p className="text-xs text-muted">Füge das Transkript deines Videos ein. Die KI analysiert es und schlägt Schnitte vor.</p>
              </div>
            </div>

            <input
              type="text"
              placeholder="Video-Titel (optional)"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-[var(--radius-lg)] bg-background text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            <textarea
              placeholder={`Füge hier dein Transkript ein...\n\nFormat (optional Timestamps):\n[0.0s - 3.5s] Heute zeige ich euch...\n[3.5s - 7.0s] Wie ihr mit KI...\n\nOder einfach Text pro Zeile:\nHeute zeige ich euch\nWie ihr mit KI arbeiten könnt`}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 border border-border rounded-[var(--radius-lg)] bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono text-xs"
            />

            <button
              onClick={handleTranscriptSubmit}
              disabled={!pastedText.trim() || loading}
              className="btn-primary mt-4 w-full justify-center disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Analysiere...</>
              ) : (
                <><Scissors size={16} /> Analysieren</>
              )}
            </button>
          </div>

          <div className="card-static p-5 flex items-start gap-3">
            <Upload size={18} className="text-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Tipp: Transkript erstellen</p>
              <p className="text-xs text-muted mt-1">
                Nutze Whisper (OpenAI) oder AssemblyAI um aus deinem Video ein Transkript mit Timestamps zu erstellen.
                Dann hier einfügen und die KI analysiert den Inhalt.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step: Analyzing */}
      {step === 'analyze' && loading && (
        <div className="card-static p-12 text-center">
          <Loader2 size={40} className="animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Analysiere dein Video...</h2>
          <p className="text-sm text-muted">Claude analysiert {transcript.length} Segmente und findet Schnittvorschläge.</p>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && scenes.length > 0 && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card-static p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{scenes.length}</div>
              <div className="text-xs text-muted">Segmente</div>
            </div>
            <div className="card-static p-4 text-center">
              <div className="text-2xl font-bold text-emerald-500">{keepScenes.length}</div>
              <div className="text-xs text-muted">Behalten</div>
            </div>
            <div className="card-static p-4 text-center">
              <div className="text-2xl font-bold text-danger">{cutScenes.length}</div>
              <div className="text-xs text-muted">Schneiden</div>
            </div>
            <div className="card-static p-4 text-center">
              <div className="text-2xl font-bold text-primary">{savedTime.toFixed(0)}s</div>
              <div className="text-xs text-muted">Gespart</div>
            </div>
          </div>

          {/* Scene List */}
          <div className="card-static overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-surface-secondary">
              <h3 className="text-sm font-semibold text-foreground">Szenen-Analyse</h3>
            </div>
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {scenes.map((scene) => (
                <div
                  key={scene.sceneId}
                  className={`px-5 py-3 flex items-start gap-3 ${
                    scene.suggestedCut ? 'bg-danger/5' : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    scene.suggestedCut
                      ? 'bg-danger/10 text-danger'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500'
                  }`}>
                    {scene.suggestedCut ? <Scissors size={12} /> : <CheckCircle2 size={12} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted">
                        {scene.startTime.toFixed(1)}s – {scene.endTime.toFixed(1)}s
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        scene.highlightScore >= 7
                          ? 'bg-primary/10 text-primary'
                          : scene.highlightScore >= 4
                          ? 'bg-surface-secondary text-muted'
                          : 'bg-danger/10 text-danger'
                      }`}>
                        ★ {scene.highlightScore}/10
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{scene.description}</p>
                    {scene.cutReason && (
                      <p className="text-xs text-danger mt-1">✂ {scene.cutReason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => { setStep('upload'); setScenes([]); setTranscript([]); setPastedText('') }}
              className="btn-ghost border border-border flex-1 justify-center"
            >
              Neues Video
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {step === 'error' && (
        <div className="card-static p-8 text-center">
          <AlertCircle size={40} className="text-danger mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Fehler bei der Analyse</h2>
          <p className="text-sm text-muted mb-4">{error}</p>
          <button onClick={() => setStep('upload')} className="btn-primary">
            Nochmal versuchen
          </button>
        </div>
      )}
    </div>
  )
}
