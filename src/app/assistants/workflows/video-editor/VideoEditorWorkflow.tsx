'use client'

import { useState, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'

type Mode = 'transcript' | 'upload'
type Step = 'input' | 'transcribing' | 'analyzing' | 'done'

interface Segment {
  start: number
  end: number
  text: string
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function StepIndicator({ step, mode }: { step: Step; mode: Mode }) {
  const steps =
    mode === 'transcript'
      ? [
          { id: 'input', label: 'Transkript' },
          { id: 'analyzing', label: 'KI-Analyse' },
          { id: 'done', label: 'Ergebnis' },
        ]
      : [
          { id: 'input', label: 'Upload' },
          { id: 'transcribing', label: 'Transkription' },
          { id: 'analyzing', label: 'KI-Analyse' },
          { id: 'done', label: 'Ergebnis' },
        ]

  const order = mode === 'transcript'
    ? ['input', 'analyzing', 'done']
    : ['input', 'transcribing', 'analyzing', 'done']

  const currentIdx = order.indexOf(step)

  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => {
        const idx = order.indexOf(s.id)
        const isActive = idx === currentIdx
        const isDone = idx < currentIdx
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                isActive ? 'bg-primary border-primary text-white' :
                isDone ? 'bg-primary/20 border-primary text-primary' :
                'bg-surface border-border text-muted'
              }`}>
                {isDone ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : i + 1}
              </div>
              <span className={`text-sm font-medium whitespace-nowrap ${isActive ? 'text-foreground' : 'text-muted'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${idx < currentIdx ? 'bg-primary/40' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  )
}

export default function VideoEditorWorkflow() {
  const [mode, setMode] = useState<Mode>('transcript')
  const [step, setStep] = useState<Step>('input')
  const [context, setContext] = useState('')
  const [manualTranscript, setManualTranscript] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [transcript, setTranscript] = useState('')
  const [segments, setSegments] = useState<Segment[]>([])
  const [analysis, setAnalysis] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (!f.type.startsWith('video/') && !f.type.startsWith('audio/')) {
      setError('Bitte eine Video- oder Audiodatei hochladen (MP4, MOV, AVI, WebM, MP3)')
      return
    }
    if (f.size > 25 * 1024 * 1024) {
      setError('Datei zu groß. Maximale Größe: 25 MB')
      return
    }
    setError('')
    setFile(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const handleStart = async () => {
    setError('')
    let finalTranscript = ''

    if (mode === 'transcript') {
      if (!manualTranscript.trim()) return
      finalTranscript = manualTranscript.trim()
      setTranscript(finalTranscript)
      setStep('analyzing')
    } else {
      if (!file) return
      setStep('transcribing')
      try {
        const formData = new FormData()
        formData.append('video', file)
        const res = await fetch('/api/workflows/transcribe', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Transkription fehlgeschlagen')
        finalTranscript = data.text
        setTranscript(data.text)
        setSegments(data.segments ?? [])
        setStep('analyzing')
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Transkription fehlgeschlagen')
        setStep('input')
        return
      }
    }

    try {
      const res = await fetch('/api/workflows/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: finalTranscript, context }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analyse fehlgeschlagen')
      setAnalysis(data.analysis)
      setStep('done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analyse fehlgeschlagen')
      setStep('input')
    }
  }

  const handleReset = () => {
    setStep('input')
    setFile(null)
    setContext('')
    setManualTranscript('')
    setTranscript('')
    setSegments([])
    setAnalysis('')
    setError('')
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <span className="text-xl">🎬</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">KI Video Editor</h1>
            <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">KI-powered</span>
          </div>
          <p className="text-xs text-muted">Transkript eingeben oder Video hochladen — Claude analysiert und empfiehlt Schnitte.</p>
        </div>
      </div>

      <StepIndicator step={step} mode={mode} />

      {/* Input Step */}
      {step === 'input' && (
        <div className="space-y-5">
          {/* Mode Toggle */}
          <div className="flex bg-surface-secondary border border-border rounded-xl p-1 w-fit gap-1">
            <button
              onClick={() => { setMode('transcript'); setError('') }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === 'transcript' ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground'
              }`}
            >
              📝 Transkript eingeben
            </button>
            <button
              onClick={() => { setMode('upload'); setError('') }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === 'upload' ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground'
              }`}
            >
              🎥 Video hochladen
            </button>
          </div>

          {/* Context */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Video-Kontext <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="z.B. YouTube-Tutorial über Next.js, ca. 10 Min."
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted/60"
            />
          </div>

          {/* Transcript Mode */}
          {mode === 'transcript' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Transkript einfügen
              </label>
              <textarea
                value={manualTranscript}
                onChange={(e) => setManualTranscript(e.target.value)}
                placeholder="Füge hier das Transkript deines Videos ein — z.B. aus YouTube-Untertiteln, CapCut, oder einem anderen Tool..."
                rows={10}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted/60 resize-y"
              />
              <p className="text-xs text-muted mt-1.5">
                Tipp: YouTube → Untertitel → Transkript anzeigen → Kopieren
              </p>
            </div>
          )}

          {/* Upload Mode */}
          {mode === 'upload' && (
            <>
              <div className="flex items-start gap-2.5 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600 mt-0.5 shrink-0">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p className="text-xs text-yellow-800">
                  Benötigt <strong>OPENAI_API_KEY</strong> in den Server-Einstellungen (Whisper-Transkription). Ohne Key: Transkript-Modus nutzen.
                </p>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  dragging ? 'border-primary bg-primary/5' :
                  file ? 'border-primary/40 bg-primary/5' :
                  'border-border hover:border-primary/40 hover:bg-surface-secondary'
                }`}
              >
                <input ref={inputRef} type="file" accept="video/*,audio/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                {file ? (
                  <>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    <button onClick={(e) => { e.stopPropagation(); setFile(null) }}
                      className="mt-3 text-xs text-muted hover:text-red-500 transition-colors">Entfernen</button>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-foreground">Video hierher ziehen oder klicken</p>
                    <p className="text-xs text-muted mt-1">MP4, MOV, AVI, WebM — max. 25 MB</p>
                  </>
                )}
              </div>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={mode === 'transcript' ? !manualTranscript.trim() : !file}
            className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-border disabled:text-white/50 text-white font-medium rounded-xl transition-colors"
          >
            {mode === 'transcript' ? 'Mit Claude analysieren' : 'Automatisch bearbeiten'}
          </button>
        </div>
      )}

      {/* Processing */}
      {(step === 'transcribing' || step === 'analyzing') && (
        <div className="bg-surface border border-border rounded-xl p-10">
          <div className="flex flex-col items-center text-center">
            <div className="text-primary mb-4"><Spinner /></div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              {step === 'transcribing' ? 'Transkribiere mit Whisper...' : 'Claude analysiert dein Video...'}
            </h2>
            <p className="text-sm text-muted">
              {step === 'transcribing'
                ? 'OpenAI Whisper erkennt Sprache und erstellt Timestamps'
                : 'Claude analysiert Szenen und empfiehlt Schnitte'}
            </p>
            {step === 'analyzing' && transcript && (
              <div className="mt-6 w-full text-left bg-surface-secondary rounded-lg p-4 max-h-40 overflow-y-auto">
                <p className="text-xs font-medium text-muted mb-2 uppercase tracking-wider">Transkript</p>
                <p className="text-xs text-foreground leading-relaxed">{transcript}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {step === 'done' && (
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Transkript</h2>
              <button onClick={() => navigator.clipboard.writeText(transcript)}
                className="text-xs text-muted hover:text-foreground transition-colors">Kopieren</button>
            </div>
            <div className="p-5 max-h-48 overflow-y-auto space-y-1">
              {segments.length > 0 ? (
                segments.map((seg, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <span className="text-primary font-mono shrink-0 w-16">{formatTime(seg.start)} →</span>
                    <span className="text-foreground">{seg.text.trim()}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap">{transcript}</p>
              )}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">KI-Analyse & Schnitt-Empfehlungen</h2>
              <button onClick={() => navigator.clipboard.writeText(analysis)}
                className="text-xs text-muted hover:text-foreground transition-colors">Kopieren</button>
            </div>
            <div className="p-5 prose prose-sm max-w-none text-foreground [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-1 [&_p]:text-sm [&_p]:leading-relaxed [&_ul]:text-sm [&_li]:leading-relaxed [&_strong]:font-semibold">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          </div>

          <button onClick={handleReset}
            className="w-full py-2.5 border border-border hover:bg-surface-secondary text-sm text-muted hover:text-foreground rounded-xl transition-colors">
            Neues Video analysieren
          </button>
        </div>
      )}
    </div>
  )
}
