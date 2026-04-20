'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { ChevronLeft, Play, CheckCircle2, Circle, BookOpen } from 'lucide-react'

interface CourseModule {
  id: string
  title: string
  slug: string
  description: string
  emoji: string
}

interface ModuleVideo {
  id: string
  wistia_hashed_id: string
  title: string
  description: string
  sort_order: number
  duration_seconds: number | null
}

export function ModuleViewClient({
  module,
  videos,
  activeVideoId,
}: {
  module: CourseModule
  videos: ModuleVideo[]
  activeVideoId: string | null
}) {
  const router = useRouter()
  const [activeId, setActiveId] = useState<string | null>(activeVideoId)
  const activeVideo = videos.find(v => v.id === activeId) ?? videos[0]
  const activeIndex = videos.findIndex(v => v.id === activeVideo?.id)

  const formatDuration = (sec: number | null) => {
    if (!sec) return null
    const min = Math.round(sec / 60)
    return min >= 60 ? `${(min / 60).toFixed(1)}h` : `${min} Min.`
  }

  const handleVideoClick = (id: string) => {
    setActiveId(id)
    router.replace(`/dashboard/classroom/${module.slug}?video=${id}`, { scroll: false })
  }

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Sidebar with Video List (Skool-Style) */}
      <aside className="lg:w-80 lg:border-r border-border bg-surface lg:h-full lg:overflow-y-auto shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <Link
            href="/dashboard/classroom"
            className="text-xs text-muted hover:text-foreground inline-flex items-center gap-1 mb-3"
          >
            <ChevronLeft size={12} /> Alle Module
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{module.emoji}</span>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground text-sm truncate">{module.title}</h2>
              <p className="text-xs text-muted">{videos.length} Lektionen</p>
            </div>
          </div>
        </div>

        {/* Video List */}
        <nav className="p-2">
          {videos.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">Noch keine Videos.</p>
          ) : (
            <div className="space-y-0.5">
              {videos.map((v, i) => {
                const isActive = v.id === activeVideo?.id
                return (
                  <button
                    key={v.id}
                    onClick={() => handleVideoClick(v.id)}
                    className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] text-left transition-colors ${
                      isActive
                        ? 'bg-primary/10'
                        : 'hover:bg-surface-hover'
                    }`}
                  >
                    <span className={`text-xs font-mono mt-0.5 shrink-0 w-5 text-right ${
                      isActive ? 'text-primary' : 'text-muted'
                    }`}>{String(i + 1).padStart(2, '0')}</span>
                    <Circle size={14} className={`mt-0.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-light'}`} fill={isActive ? 'currentColor' : 'none'} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${isActive ? 'text-foreground font-medium' : 'text-muted'}`}>
                        {v.title}
                      </p>
                      {v.duration_seconds && (
                        <p className="text-xs text-muted-light mt-0.5">{formatDuration(v.duration_seconds)}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {!activeVideo ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <BookOpen size={40} className="text-muted mb-3" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Modul-Übersicht</h2>
            <p className="text-sm text-muted max-w-md mb-2">{module.description}</p>
            <p className="text-xs text-muted">Wähle ein Video links aus.</p>
          </div>
        ) : (
          <article className="max-w-3xl mx-auto p-4 sm:p-8">
            {/* Lesson Header */}
            <div className="mb-4 flex items-center gap-2 text-xs text-muted">
              <span>Lektion {activeIndex + 1} von {videos.length}</span>
              {activeVideo.duration_seconds && (
                <>
                  <span>·</span>
                  <span>{formatDuration(activeVideo.duration_seconds)}</span>
                </>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
              {activeVideo.title}
            </h1>

            {/* Video Player */}
            <div className="card-static overflow-hidden mb-6">
              <div className="relative pb-[56.25%] bg-black">
                {/^[a-z0-9]{10}$/i.test(activeVideo.wistia_hashed_id) ? (
                  <iframe
                    key={activeVideo.id}
                    src={`https://fast.wistia.net/embed/iframe/${activeVideo.wistia_hashed_id}?autoPlay=false`}
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-center p-6">
                    <div>
                      <p className="text-lg font-semibold mb-2">Video nicht verfügbar</p>
                      <p className="text-sm text-white/60">Wistia-ID ungültig.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description (Markdown) */}
            {activeVideo.description ? (
              <div className="prose prose-sm max-w-none text-foreground">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h2 className="text-lg font-semibold mt-6 mb-2 first:mt-0">{children}</h2>,
                    h2: ({ children }) => <h3 className="text-base font-semibold mt-5 mb-2 first:mt-0">{children}</h3>,
                    h3: ({ children }) => <h4 className="text-sm font-semibold mt-4 mb-2 first:mt-0">{children}</h4>,
                    p: ({ children }) => <p className="mb-3 leading-relaxed text-sm">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-sm">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-sm">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {children}
                      </a>
                    ),
                    hr: () => <hr className="border-border my-4" />,
                  }}
                >
                  {activeVideo.description}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted italic">Keine Beschreibung verfügbar.</p>
            )}

            {/* Navigation Prev/Next */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              {activeIndex > 0 ? (
                <button
                  onClick={() => handleVideoClick(videos[activeIndex - 1].id)}
                  className="btn-ghost border border-border inline-flex"
                >
                  <ChevronLeft size={14} />
                  Vorherige Lektion
                </button>
              ) : <div />}
              {activeIndex < videos.length - 1 ? (
                <button
                  onClick={() => handleVideoClick(videos[activeIndex + 1].id)}
                  className="btn-primary inline-flex"
                >
                  Nächste Lektion
                  <Play size={14} />
                </button>
              ) : (
                <Link href="/dashboard/classroom" className="btn-primary inline-flex">
                  <CheckCircle2 size={14} />
                  Modul abgeschlossen
                </Link>
              )}
            </div>
          </article>
        )}
      </main>
    </div>
  )
}
