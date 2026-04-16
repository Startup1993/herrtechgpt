'use client'

import { useState, useEffect, useCallback } from 'react'

interface VideoItem {
  id: string
  hashedId: string
  title: string
  duration: number | null
  categories: string[]
}

interface Category {
  id: string
  label: string
  emoji: string
  videos: VideoItem[]
}

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/videos')
      const data = await res.json()
      setCategories(data.categories ?? [])
      setTotal(data.total ?? 0)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Suche + Filter
  const filteredCategories = categories
    .filter((cat) => !activeFilter || cat.id === activeFilter)
    .map((cat) => ({
      ...cat,
      videos: cat.videos.filter((v) =>
        v.title.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((cat) => cat.videos.length > 0)

  const filteredTotal = filteredCategories.reduce((n, c) => n + c.videos.length, 0)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Lernvideos</h1>
        <p className="text-sm text-muted">
          {total} Videos aus der Community — jederzeit anschauen, immer aktuell.
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
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
            label="Alle"
            active={!activeFilter}
            onClick={() => setActiveFilter(null)}
          />
          {categories.map((cat) => (
            <FilterChip
              key={cat.id}
              label={`${cat.emoji} ${cat.label}`}
              active={activeFilter === cat.id}
              onClick={() => setActiveFilter(activeFilter === cat.id ? null : cat.id)}
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

      {/* Empty state */}
      {!loading && filteredTotal === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-foreground font-medium mb-1">Keine Videos gefunden</p>
          <p className="text-sm text-muted">Versuche einen anderen Suchbegriff.</p>
        </div>
      )}

      {/* Ergebnis-Info bei Suche */}
      {!loading && search && filteredTotal > 0 && (
        <p className="text-xs text-muted mb-4">
          {filteredTotal} Ergebnis{filteredTotal !== 1 ? 'se' : ''} für &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Kategorien + Videos */}
      {!loading && filteredCategories.map((cat) => (
        <section key={cat.id} className="mb-10">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>{cat.emoji}</span> {cat.label}
            <span className="text-xs font-normal">({cat.videos.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cat.videos.map((video) => (
              <VideoCard
                key={`${cat.id}-${video.id}`}
                video={video}
                isPlaying={playingVideo === video.hashedId}
                onPlay={() => setPlayingVideo(playingVideo === video.hashedId ? null : video.hashedId)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Wistia Player Modal */}
      {playingVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPlayingVideo(null)}
        >
          <div
            className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="flex justify-end p-2 bg-black">
              <button
                onClick={() => setPlayingVideo(null)}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {/* Wistia iframe embed */}
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

function VideoCard({
  video,
  isPlaying,
  onPlay,
}: {
  video: VideoItem
  isPlaying: boolean
  onPlay: () => void
}) {
  const duration = video.duration
    ? video.duration >= 60
      ? `${Math.round(video.duration / 60 * 10) / 10}h`
      : `${Math.round(video.duration)} Min.`
    : null

  return (
    <button
      onClick={onPlay}
      className={`group text-left w-full p-4 rounded-xl border transition-all ${
        isPlaying
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-surface hover:border-primary/30 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-primary ml-0.5">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug mb-1 line-clamp-2">
            {video.title}
          </p>
          {duration && (
            <p className="text-xs text-muted">{duration}</p>
          )}
        </div>
      </div>
    </button>
  )
}

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
