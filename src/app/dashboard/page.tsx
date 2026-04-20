'use client'

import { useState, useEffect, useCallback } from 'react'

interface VideoItem {
  id: string
  hashedId: string
  title: string
  description: string | null
  duration: number | null
  thumbnail: string | null
  date: string | null
}

interface Folder {
  id: number
  name: string
  videos: VideoItem[]
}

function formatDate(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DashboardPage() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFolder, setActiveFolder] = useState<number | 'newest' | null>(null)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [collapsedFolders, setCollapsedFolders] = useState<Set<number>>(new Set())
  const [sortMode, setSortMode] = useState<'date' | 'title'>('date')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/videos')
      const data = await res.json()
      setFolders(data.folders ?? [])
      setTotal(data.total ?? 0)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleFolder = (id: number) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // "Neueste" — alle Videos flach nach Datum sortiert
  const allVideosSorted = folders
    .flatMap((f) => f.videos)
    .filter((v) => v.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      return b.date.localeCompare(a.date)
    })

  const isNewest = activeFolder === 'newest'

  // Sortier-Logik
  const sortVideos = (videos: VideoItem[]) => {
    return [...videos].sort((a, b) => {
      if (sortMode === 'date') {
        if (!a.date && !b.date) return 0
        if (!a.date) return 1
        if (!b.date) return -1
        return b.date.localeCompare(a.date)
      }
      return a.title.localeCompare(b.title, 'de')
    })
  }

  // Filter
  const filteredFolders = isNewest
    ? []
    : folders
        .filter((f) => !activeFolder || f.id === activeFolder)
        .map((f) => ({
          ...f,
          videos: sortVideos(
            f.videos.filter((v) =>
              v.title.toLowerCase().includes(search.toLowerCase()) ||
              (v.description ?? '').toLowerCase().includes(search.toLowerCase()),
            ),
          ),
        }))
        .filter((f) => f.videos.length > 0)

  const filteredTotal = isNewest
    ? allVideosSorted.length
    : filteredFolders.reduce((n, f) => n + f.videos.length, 0)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Lernvideos</h1>
        <p className="text-sm text-muted">
          {total} Videos aus der Community — jederzeit anschauen, immer aktuell.
        </p>
      </div>

      {/* Search + Folder Filter */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Video suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            label={`Alle (${total})`}
            active={!activeFolder}
            onClick={() => setActiveFolder(null)}
          />
          <FilterChip
            label="Neueste"
            active={activeFolder === 'newest'}
            onClick={() => setActiveFolder(activeFolder === 'newest' ? null : 'newest')}
          />
          {folders.map((f) => (
            <FilterChip
              key={f.id}
              label={`${f.name} (${f.videos.length})`}
              active={activeFolder === f.id}
              onClick={() => setActiveFolder(activeFolder === f.id ? null : f.id)}
            />
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-muted text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Videos werden geladen…
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && filteredTotal === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-foreground font-medium mb-1">Keine Videos gefunden</p>
          <p className="text-sm text-muted">Versuche einen anderen Suchbegriff.</p>
        </div>
      )}

      {/* Suche Ergebnis-Info */}
      {!loading && search && filteredTotal > 0 && (
        <p className="text-xs text-muted mb-4">
          {filteredTotal} Ergebnis{filteredTotal !== 1 ? 'se' : ''} für &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Neueste Videos — flache Liste nach Datum */}
      {!loading && isNewest && allVideosSorted.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allVideosSorted.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onPlay={() => setPlayingVideo(video.hashedId)}
            />
          ))}
        </div>
      )}

      {/* Ordner + Videos */}
      {!loading && !isNewest && filteredFolders.map((folder) => {
        const isCollapsed = collapsedFolders.has(folder.id)
        return (
          <section key={folder.id} className="mb-8">
            {/* Ordner-Header */}
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => toggleFolder(folder.id)}
                className="flex-1 flex items-center gap-3 group text-left min-w-0"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                    <path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {folder.name}
                  </h2>
                  <p className="text-xs text-muted">{folder.videos.length} Video{folder.videos.length !== 1 ? 's' : ''}</p>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16" height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-muted shrink-0 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {/* Sortier-Toggle */}
              {!isCollapsed && (
                <div className="flex items-center bg-surface border border-border rounded-lg overflow-hidden shrink-0">
                  <button
                    onClick={() => setSortMode('date')}
                    className={`px-2 py-1.5 text-[11px] font-medium transition-colors ${
                      sortMode === 'date'
                        ? 'bg-primary text-white'
                        : 'text-muted hover:text-foreground'
                    }`}
                    title="Nach Datum sortieren"
                  >
                    Datum
                  </button>
                  <button
                    onClick={() => setSortMode('title')}
                    className={`px-2 py-1.5 text-[11px] font-medium transition-colors ${
                      sortMode === 'title'
                        ? 'bg-primary text-white'
                        : 'text-muted hover:text-foreground'
                    }`}
                    title="Alphabetisch sortieren"
                  >
                    A–Z
                  </button>
                </div>
              )}
            </div>

            {/* Video Grid */}
            {!isCollapsed && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {folder.videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onPlay={() => setPlayingVideo(video.hashedId)}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}

      {/* Wistia Player Modal */}
      {playingVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPlayingVideo(null)}
        >
          <div
            className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-2 bg-black/60">
              <button
                onClick={() => setPlayingVideo(null)}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="relative pb-[56.25%]">
              <iframe
                src={`https://fast.wistia.net/embed/iframe/${playingVideo}?autoPlay=true`}
                allow="autoplay; fullscreen"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Video Card mit Thumbnail ──────────────────────────────────────────────────

function VideoCard({
  video,
  onPlay,
}: {
  video: VideoItem
  onPlay: () => void
}) {
  const duration = video.duration
    ? video.duration >= 60
      ? `${Math.round(video.duration / 6) / 10}h`
      : `${video.duration} Min.`
    : null

  return (
    <button
      onClick={onPlay}
      className="group text-left w-full rounded-xl border border-border bg-surface hover:border-primary/30 hover:shadow-md transition-all overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-surface-secondary overflow-hidden">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/15">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-primary/40">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-primary ml-1">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
        {/* Dauer Badge */}
        {duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
            {duration}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-foreground leading-snug mb-1 line-clamp-2">
          {video.title}
        </p>
        {video.description && (
          <p className="text-xs text-muted leading-relaxed mb-1">
            {video.description}
          </p>
        )}
        {video.date && (
          <p className="text-xs text-muted/60">{formatDate(video.date)}</p>
        )}
      </div>
    </button>
  )
}

// ── Filter Chip ───────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-primary text-white'
          : 'bg-surface border border-border text-muted hover:text-foreground hover:border-primary/30'
      }`}
    >
      {label}
    </button>
  )
}
