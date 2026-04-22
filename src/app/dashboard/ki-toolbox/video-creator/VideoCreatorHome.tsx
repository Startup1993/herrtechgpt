'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Plus,
  Video,
  Clock,
  AlertCircle,
  Sparkles,
  Film,
  Upload as UploadIcon,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react'
import {
  videoCreatorApi,
  VideoCreatorApiError,
  type Project,
} from '@/lib/video-creator-api'

type LoadState = 'loading' | 'ready' | 'error' | 'not-configured'

export default function VideoCreatorHome({
  configured,
}: {
  configured: boolean
}) {
  const [state, setState] = useState<LoadState>('loading')
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!configured) {
      setState('not-configured')
      return
    }
    void loadProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured])

  async function loadProjects() {
    setState('loading')
    setError(null)
    try {
      const { projects } = await videoCreatorApi.listProjects()
      setProjects(projects)
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
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/ki-toolbox"
          className="text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">KI Video Creator</h1>
          <p className="text-sm text-muted">
            Erstelle komplette KI-Videos aus Prompt, URL oder eigenem Upload.
          </p>
        </div>
        <Link
          href="/dashboard/ki-toolbox/video-creator/new"
          className="btn-primary hidden sm:inline-flex"
        >
          <Plus size={16} />
          Neues Projekt
        </Link>
      </div>

      <QuickStart />

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
            Deine Projekte
          </h2>
          <Link
            href="/dashboard/ki-toolbox/video-creator/new"
            className="btn-primary sm:hidden"
          >
            <Plus size={14} />
            Neu
          </Link>
        </div>

        {state === 'loading' && <LoadingState />}
        {state === 'not-configured' && <NotConfiguredState />}
        {state === 'error' && <ErrorState error={error} onRetry={loadProjects} />}
        {state === 'ready' && projects.length === 0 && <EmptyState />}
        {state === 'ready' && projects.length > 0 && (
          <ProjectList projects={projects} />
        )}
      </div>
    </div>
  )
}

function QuickStart() {
  const quickActions = [
    {
      href: '/dashboard/ki-toolbox/video-creator/new?tab=url',
      icon: LinkIcon,
      title: 'Video von URL',
      description: 'YouTube, Instagram oder TikTok — automatisch neu erzählt.',
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600',
    },
    {
      href: '/dashboard/ki-toolbox/video-creator/new?tab=upload',
      icon: UploadIcon,
      title: 'Video hochladen',
      description: 'Eigenes Video als Vorlage — KI erkennt Szenen und Text.',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    },
    {
      href: '/dashboard/ki-toolbox/video-creator/new?tab=prompt',
      icon: Sparkles,
      title: 'Von Prompt',
      description: 'Beschreibe dein Video — KI erstellt Szenen-Skript.',
      iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {quickActions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="card-static relative flex flex-col p-5 hover:shadow-lg hover:border-primary/30 transition-all group"
        >
          <div
            className={`w-10 h-10 rounded-[var(--radius-lg)] ${a.iconBg} flex items-center justify-center mb-3`}
          >
            <a.icon size={20} className="text-white" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">{a.title}</h3>
          <p className="text-xs text-muted leading-relaxed">{a.description}</p>
        </Link>
      ))}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="card-static p-8 text-center">
      <Loader2
        size={32}
        className="animate-spin text-primary mx-auto mb-3"
      />
      <p className="text-sm text-muted">Lade deine Projekte…</p>
    </div>
  )
}

function NotConfiguredState() {
  return (
    <div className="card-static p-6 border-amber-200 dark:border-amber-900/40">
      <div className="flex gap-3">
        <AlertCircle
          size={20}
          className="text-amber-500 shrink-0 mt-0.5"
        />
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Video-Creator-Service noch nicht konfiguriert
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            Der Worker auf Hetzner läuft noch nicht oder{' '}
            <code className="text-xs bg-surface-hover px-1 py-0.5 rounded">
              VIDEO_CREATOR_INTERNAL_URL
            </code>{' '}
            ist in Vercel nicht gesetzt. Sobald der Server deployed ist,
            erscheinen hier deine Projekte.
          </p>
        </div>
      </div>
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
            Projekte konnten nicht geladen werden
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

function EmptyState() {
  return (
    <div className="card-static p-10 text-center">
      <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-500 flex items-center justify-center mx-auto mb-3">
        <Film size={28} />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        Noch keine Projekte
      </h3>
      <p className="text-sm text-muted mb-5">
        Starte mit einer der Optionen oben.
      </p>
    </div>
  )
}

function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div className="space-y-2">
      {projects.map((p) => (
        <Link
          key={p.id}
          href={`/dashboard/ki-toolbox/video-creator/scenes/${p.id}`}
          className="card-static flex items-center gap-4 p-4 hover:shadow-md hover:border-primary/30 transition-all"
        >
          <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-purple-50 dark:bg-purple-950/30 text-purple-500 flex items-center justify-center shrink-0">
            <Video size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {p.title ?? 'Unbenanntes Projekt'}
            </h3>
            <p className="text-xs text-muted flex items-center gap-2 mt-0.5">
              <Clock size={11} />
              {new Date(p.createdAt).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              <span className="text-border">·</span>
              <StatusBadge status={p.status} />
            </p>
          </div>
          <ChevronLeft
            size={18}
            className="rotate-180 text-muted shrink-0"
          />
        </Link>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const label: Record<string, string> = {
    uploaded: 'Hochgeladen',
    setup_done: 'Eingerichtet',
    processing: 'Wird verarbeitet',
    scenes_ready: 'Szenen bereit',
    exported: 'Exportiert',
  }
  return <span>{label[status] ?? status}</span>
}
