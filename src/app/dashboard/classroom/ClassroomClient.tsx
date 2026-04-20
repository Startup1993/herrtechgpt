'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, BookOpen } from 'lucide-react'

interface Module {
  id: string
  title: string
  slug: string
  description: string
  emoji: string
  sort_order: number
  videoCount: number
  totalDurationMin: number
}

export function ClassroomClient({ modules }: { modules: Module[] }) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? modules.filter(m =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())
      )
    : modules

  const totalVideos = modules.reduce((sum, m) => sum + m.videoCount, 0)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Classroom</h1>
        <p className="text-sm text-muted mb-6">
          {modules.length} Module · {totalVideos} Videos
        </p>

        {/* Search */}
        <div className="max-w-2xl mx-auto card-static p-3 flex items-center gap-3">
          <Search size={18} className="text-muted shrink-0" />
          <input
            type="text"
            placeholder="Modul suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
        </div>
      </div>

      {/* Empty state */}
      {modules.length === 0 && (
        <div className="card-static p-12 text-center">
          <BookOpen size={40} className="text-muted mx-auto mb-4" />
          <h2 className="font-semibold text-foreground mb-2">Noch keine Module verfügbar</h2>
          <p className="text-sm text-muted">
            Bitte führe die Datenbank-Migration aus oder kontaktiere den Admin.
          </p>
        </div>
      )}

      {filtered.length === 0 && modules.length > 0 && (
        <div className="text-center py-16">
          <p className="text-muted">Kein Modul gefunden für &quot;{search}&quot;</p>
        </div>
      )}

      {/* Module Grid (Skool-Style cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((m) => (
          <Link
            key={m.id}
            href={`/dashboard/classroom/${m.slug}`}
            className="card group flex flex-col p-5 min-h-[200px]"
          >
            {/* Emoji as cover */}
            <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-primary/10 flex items-center justify-center mb-4 text-3xl group-hover:bg-primary/20 transition-colors">
              {m.emoji}
            </div>

            <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-2">{m.title}</h3>
            <p className="text-xs text-muted mb-3 line-clamp-2 flex-1">{m.description}</p>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">
                {m.videoCount} Video{m.videoCount !== 1 ? 's' : ''}
                {m.totalDurationMin > 0 && ` · ${m.totalDurationMin} Min.`}
              </span>
              <span className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                Öffnen <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
