'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeft,
  Link as LinkIcon,
  Upload as UploadIcon,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  videoCreatorApi,
  videoCreatorFetch,
  VideoCreatorApiError,
} from '@/lib/video-creator-api'

type Tab = 'url' | 'upload' | 'prompt'

const TABS: { id: Tab; label: string; icon: typeof LinkIcon }[] = [
  { id: 'url', label: 'Von URL', icon: LinkIcon },
  { id: 'upload', label: 'Upload', icon: UploadIcon },
  { id: 'prompt', label: 'Von Prompt', icon: Sparkles },
]

export default function NewProjectForm() {
  const router = useRouter()
  const params = useSearchParams()
  const initialTab = (params.get('tab') as Tab) || 'prompt'
  const [tab, setTab] = useState<Tab>(
    TABS.some((t) => t.id === initialTab) ? initialTab : 'prompt',
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
  }, [tab])

  async function wrapBusy<T>(fn: () => Promise<T>): Promise<T | null> {
    setBusy(true)
    setError(null)
    try {
      return await fn()
    } catch (e) {
      const msg =
        e instanceof VideoCreatorApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Unbekannter Fehler'
      setError(msg)
      return null
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/ki-toolbox/video-creator"
          className="text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Neues Projekt</h1>
          <p className="text-sm text-muted">Starte mit URL, Upload oder Prompt.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card-static p-1 flex gap-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-primary text-white'
                : 'text-muted hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="card-static p-4 mb-6 border-red-200 dark:border-red-900/40 flex gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">{error}</p>
        </div>
      )}

      {tab === 'prompt' && (
        <PromptTab
          busy={busy}
          onSubmit={async (prompt) => {
            const r = await wrapBusy(() => videoCreatorApi.createFromPrompt(prompt))
            if (r?.projectId) {
              router.push(
                `/dashboard/ki-toolbox/video-creator/scenes/${r.projectId}`,
              )
            }
          }}
        />
      )}

      {tab === 'upload' && (
        <UploadTab
          busy={busy}
          onUpload={async (file) => {
            const r = await wrapBusy(() => videoCreatorApi.uploadVideo(file))
            if (r?.projectId) {
              router.push(
                `/dashboard/ki-toolbox/video-creator/setup/${r.projectId}`,
              )
            }
          }}
        />
      )}

      {tab === 'url' && (
        <UrlTab
          busy={busy}
          onSubmit={async (url, language) => {
            const r = await wrapBusy(async () => {
              // 1) blanko Projekt anlegen (kein video)
              const created = await videoCreatorApi.createManual()
              // 2) Setup mit URL triggern
              await videoCreatorFetch(
                `/api/projects/${created.projectId}/setup`,
                {
                  method: 'POST',
                  body: {
                    videoUrl: url,
                    subtitleLanguage: language,
                  } as unknown as BodyInit,
                },
              )
              return created
            })
            if (r?.projectId) {
              router.push(
                `/dashboard/ki-toolbox/video-creator/setup/${r.projectId}`,
              )
            }
          }}
        />
      )}
    </div>
  )
}

// ─── Tab: Prompt ─────────────────────────────────────────────────────────────

function PromptTab({
  busy,
  onSubmit,
}: {
  busy: boolean
  onSubmit: (prompt: string) => void | Promise<void>
}) {
  const [prompt, setPrompt] = useState('')

  const examples = [
    '30-Sekunden Reel: 3 KI-Tools die jeder Creator kennen muss',
    'Erklär-Video: Wie funktioniert ein Sales Funnel in 60 Sekunden',
    'Motivations-Short: Warum die meisten Unternehmer scheitern',
  ]

  return (
    <div className="space-y-6">
      <div className="card-static p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Beschreibe dein Video
        </h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          placeholder="z.B. Ein 30-Sekunden Instagram-Reel über die 5 besten KI-Tools für Content Creator in 2025. Hook am Anfang, CTA am Ende."
          className="w-full px-4 py-3 border border-border rounded-[var(--radius-lg)] bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={() => void onSubmit(prompt.trim())}
          disabled={busy || !prompt.trim()}
          className="btn-primary w-full justify-center mt-4 disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Erstelle Szenen-Skript…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Szenen generieren
            </>
          )}
        </button>
      </div>

      <div className="card-static p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Beispiel-Prompts
        </h3>
        <div className="space-y-2">
          {examples.map((e) => (
            <button
              key={e}
              onClick={() => setPrompt(e)}
              className="w-full text-left px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-hover rounded-[var(--radius-md)] transition-colors"
            >
              &quot;{e}&quot;
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Upload ─────────────────────────────────────────────────────────────

function UploadTab({
  busy,
  onUpload,
}: {
  busy: boolean
  onUpload: (file: File) => void | Promise<void>
}) {
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="card-static p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4">
        Video hochladen
      </h2>

      <div
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed border-border rounded-[var(--radius-lg)] p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-surface-hover transition-colors ${
          busy ? 'pointer-events-none opacity-60' : ''
        }`}
      >
        <UploadIcon size={32} className="text-muted mx-auto mb-3" />
        {file ? (
          <>
            <p className="text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted mt-1">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground">
              Klicke zum Auswählen oder ziehe eine Datei hierher
            </p>
            <p className="text-xs text-muted mt-1">
              MP4, MOV, WEBM — max. 500 MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <button
        onClick={() => file && void onUpload(file)}
        disabled={!file || busy}
        className="btn-primary w-full justify-center mt-4 disabled:opacity-50"
      >
        {busy ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Lade hoch…
          </>
        ) : (
          <>
            <UploadIcon size={16} />
            Hochladen und starten
          </>
        )}
      </button>
    </div>
  )
}

// ─── Tab: URL ────────────────────────────────────────────────────────────────

function UrlTab({
  busy,
  onSubmit,
}: {
  busy: boolean
  onSubmit: (url: string, language: 'original' | 'de') => void | Promise<void>
}) {
  const [url, setUrl] = useState('')
  const [language, setLanguage] = useState<'original' | 'de'>('de')

  return (
    <div className="card-static p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4">
        Video von URL
      </h2>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted block mb-2">
            Video-URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=… oder https://www.instagram.com/reel/…"
            className="w-full px-4 py-2.5 border border-border rounded-[var(--radius-lg)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-xs text-muted mt-1.5">
            Unterstützt: YouTube, Instagram, TikTok, Vimeo.
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-muted block mb-2">
            Sprache der Transkription
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage('original')}
              className={`flex-1 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors border ${
                language === 'original'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted hover:text-foreground'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setLanguage('de')}
              className={`flex-1 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors border ${
                language === 'de'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted hover:text-foreground'
              }`}
            >
              Deutsch übersetzen
            </button>
          </div>
        </div>

        <button
          onClick={() => void onSubmit(url.trim(), language)}
          disabled={busy || !url.trim()}
          className="btn-primary w-full justify-center disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Lege Projekt an…
            </>
          ) : (
            <>
              <LinkIcon size={16} />
              Projekt anlegen
            </>
          )}
        </button>
      </div>
    </div>
  )
}
