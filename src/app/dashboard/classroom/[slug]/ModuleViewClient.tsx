'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { ChevronLeft, Play, CheckCircle2, Circle, BookOpen, ChevronDown } from 'lucide-react'

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
  chapter_id: string | null
}

interface Chapter {
  id: string
  title: string
  description: string
  sort_order: number
}

interface Group {
  kind: 'chapter' | 'direct'
  chapter?: Chapter
  videos: ModuleVideo[]
}

export function ModuleViewClient({
  module,
  videos,
  chapters,
  activeVideoId,
}: {
  module: CourseModule
  videos: ModuleVideo[]
  chapters: Chapter[]
  activeVideoId: string | null
}) {
  const router = useRouter()
  const [activeId, setActiveId] = useState<string | null>(activeVideoId)
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(new Set())

  const activeVideo = videos.find(v => v.id === activeId) ?? videos[0]
  const activeIndex = videos.findIndex(v => v.id === activeVideo?.id)

  // Group videos: direct-first, then by chapter
  const groups = useMemo<Group[]>(() => {
    const directVideos = videos.filter(v => !v.chapter_id)
    const result: Group[] = []
    if (directVideos.length > 0) {
      result.push({ kind: 'direct', videos: directVideos })
    }
    for (const chapter of chapters) {
      const chapterVideos = videos.filter(v => v.chapter_id === chapter.id)
      if (chapterVideos.length > 0) {
        result.push({ kind: 'chapter', chapter, videos: chapterVideos })
      }
    }
    return result
  }, [videos, chapters])

  // Active chapter (for showing which is open)
  const activeChapterId = activeVideo?.chapter_id ?? null

  const formatDuration = (sec: number | null) => {
    if (!sec) return null
    const min = Math.round(sec / 60)
    return min >= 60 ? `${(min / 60).toFixed(1)}h` : `${min} Min.`
  }

  const handleVideoClick = (id: string) => {
    setActiveId(id)
    router.replace(`/dashboard/classroom/${module.slug}?video=${id}`, { scroll: false })
  }

  const toggleChapter = (chapterId: string) => {
    setCollapsedChapters(prev => {
      const next = new Set(prev)
      if (next.has(chapterId)) next.delete(chapterId)
      else next.add(chapterId)
      return next
    })
  }

  // Global lesson number tracker
  let globalIndex = 0

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Sidebar */}
      <aside className="lg:w-80 lg:border-r border-border bg-surface lg:h-full lg:overflow-y-auto shrink-0">
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
              <h2 className="font-semibold text-foreground text-sm">{module.title}</h2>
              <p className="text-xs text-muted">{videos.length} Lektionen{chapters.length > 0 && ` · ${chapters.length} Kapitel`}</p>
            </div>
          </div>
        </div>

        <nav className="p-2">
          {videos.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">Noch keine Videos.</p>
          ) : (
            <div className="space-y-1">
              {groups.map((group, gIdx) => {
                if (group.kind === 'direct') {
                  // Direct lessons (no chapter wrapper)
                  return (
                    <div key={`direct-${gIdx}`} className="space-y-0.5">
                      {group.videos.map(v => {
                        globalIndex++
                        const isActive = v.id === activeVideo?.id
                        const num = globalIndex
                        return (
                          <LessonRow
                            key={v.id}
                            video={v}
                            num={num}
                            isActive={isActive}
                            onClick={() => handleVideoClick(v.id)}
                            formatDuration={formatDuration}
                          />
                        )
                      })}
                    </div>
                  )
                } else {
                  // Chapter with nested lessons
                  const chapter = group.chapter!
                  const isCollapsed = collapsedChapters.has(chapter.id) && chapter.id !== activeChapterId
                  const chapterHasActive = group.videos.some(v => v.id === activeVideo?.id)
                  return (
                    <div key={chapter.id} className="mt-3">
                      <button
                        onClick={() => toggleChapter(chapter.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-left transition-colors ${
                          chapterHasActive ? 'bg-primary/5 text-primary' : 'text-foreground hover:bg-surface-hover'
                        }`}
                      >
                        <ChevronDown size={14} className={`transition-transform shrink-0 ${isCollapsed ? '-rotate-90' : ''}`} />
                        <span className="text-xs font-semibold uppercase tracking-wider flex-1 truncate">
                          {chapter.title}
                        </span>
                        <span className="text-xs text-muted">{group.videos.length}</span>
                      </button>
                      {!isCollapsed && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-border pl-2">
                          {group.videos.map(v => {
                            globalIndex++
                            const isActive = v.id === activeVideo?.id
                            return (
                              <LessonRow
                                key={v.id}
                                video={v}
                                num={globalIndex}
                                isActive={isActive}
                                onClick={() => handleVideoClick(v.id)}
                                formatDuration={formatDuration}
                              />
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }
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
            <div className="mb-4 flex items-center gap-2 text-xs text-muted flex-wrap">
              {activeVideo.chapter_id && (
                <>
                  <span className="font-medium">
                    {chapters.find(c => c.id === activeVideo.chapter_id)?.title}
                  </span>
                  <span>·</span>
                </>
              )}
              <span>Lektion {activeIndex + 1} von {videos.length}</span>
              {(activeVideo.duration_seconds ?? 0) > 0 ? (
                <>
                  <span>·</span>
                  <span>{formatDuration(activeVideo.duration_seconds)}</span>
                </>
              ) : null}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
              {activeVideo.title}
            </h1>

            {/^[a-z0-9]{10}$/i.test(activeVideo.wistia_hashed_id) && (
              <div className="card-static overflow-hidden mb-6">
                <div className="relative pb-[56.25%] bg-black">
                  <iframe
                    key={activeVideo.id}
                    src={`https://fast.wistia.net/embed/iframe/${activeVideo.wistia_hashed_id}?autoPlay=false`}
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>
            )}

            {activeVideo.description ? (
              <div className="text-foreground">
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
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-4 italic my-3 text-muted">{children}</blockquote>,
                    code: ({ children }) => <code className="bg-surface-secondary px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                    img: ({ src, alt }) => (
                      <span className="block my-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={alt ?? ''} className="rounded-[var(--radius-lg)] max-w-full h-auto border border-border" />
                        {alt && <span className="block text-xs text-muted mt-1 text-center italic">{alt}</span>}
                      </span>
                    ),
                  }}
                >
                  {activeVideo.description}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted italic">Keine Beschreibung verfügbar.</p>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              {activeIndex > 0 ? (
                <button
                  onClick={() => handleVideoClick(videos[activeIndex - 1].id)}
                  className="btn-ghost border border-border inline-flex"
                >
                  <ChevronLeft size={14} />
                  Vorherige
                </button>
              ) : <div />}
              {activeIndex < videos.length - 1 ? (
                <button
                  onClick={() => handleVideoClick(videos[activeIndex + 1].id)}
                  className="btn-primary inline-flex"
                >
                  Nächste
                  <Play size={14} />
                </button>
              ) : (
                <Link href="/dashboard/classroom" className="btn-primary inline-flex">
                  <CheckCircle2 size={14} />
                  Abgeschlossen
                </Link>
              )}
            </div>
          </article>
        )}
      </main>
    </div>
  )
}

function LessonRow({
  video, num, isActive, onClick, formatDuration,
}: {
  video: ModuleVideo
  num: number
  isActive: boolean
  onClick: () => void
  formatDuration: (sec: number | null) => string | null
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-left transition-colors ${
        isActive ? 'bg-primary/10' : 'hover:bg-surface-hover'
      }`}
    >
      <span className={`text-xs font-mono mt-0.5 shrink-0 w-5 text-right ${
        isActive ? 'text-primary' : 'text-muted'
      }`}>{String(num).padStart(2, '0')}</span>
      <Circle
        size={12}
        className={`mt-1 shrink-0 ${isActive ? 'text-primary' : 'text-muted-light'}`}
        fill={isActive ? 'currentColor' : 'none'}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${isActive ? 'text-foreground font-medium' : 'text-muted'}`}>
          {video.title}
        </p>
        {(video.duration_seconds ?? 0) > 0 ? (
          <p className="text-xs text-muted-light mt-0.5">{formatDuration(video.duration_seconds)}</p>
        ) : null}
      </div>
    </button>
  )
}
