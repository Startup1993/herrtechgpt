'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Play, ChevronDown, ChevronRight, GraduationCap } from 'lucide-react'

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

export default function ClassroomPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/videos')
      const data = await res.json()
      setCategories(data.categories ?? [])
      setTotal(data.total ?? 0)
      // Expand first category by default
      if (data.categories?.[0]) {
        setExpandedCategories(new Set([data.categories[0].id]))
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Filter
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Classroom</h1>
        <p className="text-sm text-muted mb-6">
          {total} Lernvideos — jederzeit anschauen, immer aktuell.
        </p>

        {/* Search */}
        <div className="max-w-2xl mx-auto card-static p-3 flex items-center gap-3">
          <Search size={18} className="text-muted shrink-0" />
          <input
            type="text"
            placeholder="Video suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
          {search && (
            <span className="text-xs text-muted shrink-0">{filteredTotal} Ergebnisse</span>
          )}
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <FilterChip label="Alle" active={!activeFilter} onClick={() => setActiveFilter(null)} />
        {categories.map((cat) => (
          <FilterChip
            key={cat.id}
            label={`${cat.emoji} ${cat.label}`}
            active={activeFilter === cat.id}
            onClick={() => setActiveFilter(activeFilter === cat.id ? null : cat.id)}
          />
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-muted text-sm gap-2">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Videos werden geladen...
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

      {/* Modules (Skool-Style: collapsible categories with video list) */}
      {!loading && filteredCategories.map((cat) => {
        const isExpanded = expandedCategories.has(cat.id) || !!search
        return (
          <section key={cat.id} className="mb-4">
            {/* Module Header — clickable to expand/collapse */}
            <button
              onClick={() => toggleCategory(cat.id)}
              className="w-full flex items-center gap-3 p-4 card-static hover:border-primary/30 transition-all text-left"
            >
              <span className="text-xl">{cat.emoji}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-foreground">{cat.label}</h2>
                <p className="text-xs text-muted">{cat.videos.length} Videos</p>
              </div>
              {isExpanded ? (
                <ChevronDown size={18} className="text-muted shrink-0" />
              ) : (
                <ChevronRight size={18} className="text-muted shrink-0" />
              )}
            </button>

            {/* Video List */}
            {isExpanded && (
              <div className="ml-4 sm:ml-8 mt-1 border-l-2 border-border pl-4 sm:pl-6 py-2 space-y-1">
                {cat.videos.map((video, i) => (
                  <VideoRow
                    key={`${cat.id}-${video.id}`}
                    video={video}
                    index={i + 1}
                    isPlaying={playingVideo === video.hashedId}
                    onPlay={() => setPlayingVideo(playingVideo === video.hashedId ? null : video.hashedId)}
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
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPlayingVideo(null)}
        >
          <div
            className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
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

function VideoRow({
  video,
  index,
  isPlaying,
  onPlay,
}: {
  video: VideoItem
  index: number
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
      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)] text-left transition-all ${
        isPlaying
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-surface-hover text-foreground'
      }`}
    >
      <span className="text-xs text-muted w-6 text-right shrink-0">{index}.</span>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
        isPlaying ? 'bg-primary text-white' : 'bg-surface-secondary text-muted group-hover:bg-primary/10 group-hover:text-primary'
      }`}>
        <Play size={12} className={isPlaying ? '' : 'ml-0.5'} fill={isPlaying ? 'currentColor' : 'none'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug truncate">{video.title}</p>
      </div>
      {duration && (
        <span className="text-xs text-muted shrink-0">{duration}</span>
      )}
    </button>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-primary text-white'
          : 'bg-surface border border-border text-muted hover:text-foreground hover:border-primary/30'
      }`}
    >
      {label}
    </button>
  )
}
