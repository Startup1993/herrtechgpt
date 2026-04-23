'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  Film,
} from 'lucide-react'
import {
  videoCreatorApi,
  VideoCreatorApiError,
  workerMediaUrl,
  type Project,
  type Scene,
} from '@/lib/video-creator-api'

type LoadState = 'loading' | 'ready' | 'error'

export default function ScenesView({ projectId }: { projectId: string }) {
  const [state, setState] = useState<LoadState>('loading')
  const [project, setProject] = useState<Project | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const p = await videoCreatorApi.getProject(projectId)
      setProject(p)
      setState('ready')
    } catch (e) {
      const msg =
        e instanceof VideoCreatorApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Unbekannter Fehler'
      setError(msg)
      setState('error')
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Header project={project} projectId={projectId} />
      <Breadcrumb projectId={projectId} />

      {state === 'loading' && <LoadingState />}
      {state === 'error' && <ErrorState error={error} onRetry={load} />}
      {state === 'ready' && project && <Body project={project} />}
    </div>
  )
}

function Header({
  project,
  projectId,
}: {
  project: Project | null
  projectId: string
}) {
  const title = project?.title || 'Projekt'
  return (
    <div className="flex items-center gap-3 mb-4">
      <Link
        href="/dashboard/ki-toolbox/video-creator"
        className="text-muted hover:text-foreground transition-colors"
        aria-label="Zurück zur Übersicht"
      >
        <ChevronLeft size={20} />
      </Link>
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold text-foreground truncate">{title}</h1>
        <p className="text-xs text-muted font-mono truncate">{projectId}</p>
      </div>
      {project?.setup?.format && (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-border text-muted">
          {project.setup.format}
        </span>
      )}
    </div>
  )
}

function Breadcrumb({ projectId: _projectId }: { projectId: string }) {
  // Chunk 1: nur Anzeige. Navigation zu anderen Schritten (Setup/Videos/Export)
  // folgt in späteren Chunks, wenn die Seiten existieren.
  const steps = [
    { label: '1 Upload & Analyse', active: false, enabled: false },
    { label: '2 Szenen & Bilder', active: true, enabled: true },
    { label: '3 Videos generieren', active: false, enabled: false },
    { label: '4 Export', active: false, enabled: false },
  ]
  return (
    <div className="flex items-center justify-center flex-wrap gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          {i > 0 && <span className="text-border">→</span>}
          <span
            className={
              s.active
                ? 'text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary'
                : 'text-xs font-semibold px-3 py-1 rounded-full border border-border text-muted opacity-50'
            }
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function Body({ project }: { project: Project }) {
  const scenes = project.scenes ?? []

  if (scenes.length === 0) {
    return (
      <div className="card-static p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-500 flex items-center justify-center mx-auto mb-3">
          <Film size={28} />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Noch keine Szenen
        </h3>
        <p className="text-sm text-muted">
          Das Projekt ist angelegt, enthält aber noch keine Szenen. Je nach
          Flow läuft die Szenen-Erkennung noch im Hintergrund, oder es wurde
          noch kein Skript generiert.
        </p>
      </div>
    )
  }

  const withImage = scenes.filter((s) => s.imageFile).length
  const approved = scenes.filter((s) => s.imageApproved).length

  return (
    <>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {scenes.length} Szene{scenes.length !== 1 ? 'n' : ''}
          </h2>
          <p className="text-sm text-muted">
            Skript-Übersicht. Bearbeiten, Bild- und Videogenerierung folgen im
            nächsten Update.
          </p>
        </div>
        <div className="flex gap-2">
          {withImage > 0 && (
            <Stat value={withImage} label="mit Bild" tone="primary" />
          )}
          {approved > 0 && (
            <Stat value={approved} label="freigegeben" tone="success" />
          )}
        </div>
      </div>

      <div className="space-y-3">
        {scenes.map((scene, idx) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            index={idx}
            projectId={project.id}
          />
        ))}
      </div>
    </>
  )
}

function SceneCard({
  scene,
  index,
  projectId,
}: {
  scene: Scene
  index: number
  projectId: string
}) {
  const imgSrc = scene.imageFile
    ? workerMediaUrl(projectId, scene.imageFile)
    : null

  return (
    <div className="card-static p-4 flex gap-4">
      <div className="w-9 h-9 shrink-0 rounded-full bg-surface-hover border border-border text-muted text-sm font-bold flex items-center justify-center">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
          <span className="text-xs font-mono text-muted">
            {fmtTime(scene.start)} – {fmtTime(scene.end)}
          </span>
          <StatusBadge scene={scene} />
        </div>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
          {scene.script?.trim() || scene.text?.trim() || (
            <span className="italic text-muted">Kein Skript-Text</span>
          )}
        </p>
      </div>

      {imgSrc && (
        <div className="w-20 h-20 shrink-0 rounded-[var(--radius-lg)] overflow-hidden border border-border bg-surface-hover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={`Szene ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  )
}

function StatusBadge({ scene }: { scene: Scene }) {
  if (scene.imageApproved) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
        <CheckCircle2 size={10} /> Freigegeben
      </span>
    )
  }
  if (scene.imageFile) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
        <ImageIcon size={10} /> Bild generiert
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-border text-muted">
      Noch kein Bild
    </span>
  )
}

function Stat({
  value,
  label,
  tone,
}: {
  value: number
  label: string
  tone: 'primary' | 'success'
}) {
  const cls =
    tone === 'success'
      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
      : 'bg-primary/10 border-primary/30 text-primary'
  return (
    <div className={`rounded-[var(--radius-lg)] border px-3 py-2 text-center ${cls}`}>
      <div className="text-lg font-extrabold leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider mt-1">{label}</div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="card-static p-8 text-center">
      <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
      <p className="text-sm text-muted">Lade Szenen…</p>
    </div>
  )
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string | null
  onRetry: () => void
}) {
  return (
    <div className="card-static p-6 border-red-200 dark:border-red-900/40">
      <div className="flex gap-3 mb-4">
        <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Projekt konnte nicht geladen werden
          </h3>
          <p className="text-sm text-muted">{error}</p>
        </div>
      </div>
      <button onClick={onRetry} className="btn-ghost border border-border">
        Erneut versuchen
      </button>
    </div>
  )
}

function fmtTime(sec: number | undefined | null): string {
  if (sec == null || !Number.isFinite(sec)) return '--:--'
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0')
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0')
  return `${m}:${s}`
}
