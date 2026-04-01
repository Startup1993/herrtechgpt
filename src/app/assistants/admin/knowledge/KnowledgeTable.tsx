'use client'

import { useState, useTransition } from 'react'

interface Video {
  video_id: string
  video_name: string
  duration_minutes: number
  is_active: boolean
  chunk_count: number
}

async function toggleVideo(videoId: string, active: boolean) {
  await fetch('/api/admin/knowledge', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video_id: videoId, is_active: active }),
  })
}

export function KnowledgeTable({ videos }: { videos: Video[] }) {
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(videos.map((v) => [v.video_id, v.is_active]))
  )
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  const filtered = videos.filter((v) =>
    v.video_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggle = (videoId: string) => {
    const newVal = !states[videoId]
    setStates((prev) => ({ ...prev, [videoId]: newVal }))
    startTransition(async () => {
      await toggleVideo(videoId, newVal)
    })
  }

  const handleToggleAll = (active: boolean) => {
    const newStates = { ...states }
    filtered.forEach((v) => { newStates[v.video_id] = active })
    setStates(newStates)
    startTransition(async () => {
      await Promise.all(filtered.map((v) => toggleVideo(v.video_id, active)))
    })
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <input
          type="text"
          placeholder="Videos suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm bg-surface-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={() => handleToggleAll(true)}
          className="text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
        >
          Alle aktivieren
        </button>
        <button
          onClick={() => handleToggleAll(false)}
          className="text-xs px-3 py-2 rounded-lg bg-surface-secondary text-muted hover:bg-border transition-colors whitespace-nowrap"
        >
          Alle deaktivieren
        </button>
      </div>

      {/* Table */}
      <div className="divide-y divide-border">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted text-sm">
            {videos.length === 0
              ? 'Noch keine Videos transkribiert. Läuft noch...'
              : 'Keine Videos gefunden.'}
          </div>
        )}
        {filtered.map((video) => {
          const active = states[video.video_id] ?? video.is_active
          return (
            <div
              key={video.video_id}
              className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                active ? '' : 'opacity-50'
              }`}
            >
              {/* Toggle */}
              <button
                onClick={() => handleToggle(video.video_id)}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none ${
                  active ? 'bg-primary' : 'bg-border'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${
                    active ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>

              {/* Video info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {video.video_name}
                </p>
                <p className="text-xs text-muted">
                  {Math.round(video.duration_minutes)} min · {video.chunk_count} Abschnitte
                </p>
              </div>

              {/* Status badge */}
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                active
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                  : 'bg-surface-secondary text-muted'
              }`}>
                {active ? 'Aktiv' : 'Deaktiviert'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
