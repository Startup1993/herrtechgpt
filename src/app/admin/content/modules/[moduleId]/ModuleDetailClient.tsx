'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus, Edit, Trash2, Eye, EyeOff, Search, Loader2, X, Video as VideoIcon, Save } from 'lucide-react'

interface Module {
  id: string
  title: string
  emoji: string
}

interface ModuleVideo {
  id: string
  module_id: string
  wistia_hashed_id: string
  title: string
  description: string
  sort_order: number
  duration_seconds: number | null
  is_published: boolean
}

interface WistiaVideo {
  hashedId: string
  title: string
  duration: number
  thumbnail: string | null
}

export function ModuleDetailClient({
  module,
  initialVideos,
  allModules,
}: {
  module: Module & { description: string }
  initialVideos: ModuleVideo[]
  allModules: Module[]
}) {
  const router = useRouter()
  const [videos, setVideos] = useState(initialVideos)
  const [editing, setEditing] = useState<ModuleVideo | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const handleSave = async (video: Partial<ModuleVideo>) => {
    setLoading('save')
    const isNew = !video.id
    const res = await fetch('/api/admin/module-videos', {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isNew ? { ...video, module_id: module.id } : video),
    })
    setLoading(null)
    if (res.ok) {
      router.refresh()
      setEditing(null)
      setShowAdd(false)
    }
  }

  const handleDelete = async (id: string) => {
    setLoading(id)
    await fetch(`/api/admin/module-videos?id=${id}`, { method: 'DELETE' })
    setLoading(null)
    setConfirmDelete(null)
    setVideos(videos.filter(v => v.id !== id))
    router.refresh()
  }

  const handleTogglePublish = async (v: ModuleVideo) => {
    setLoading(v.id)
    await fetch('/api/admin/module-videos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: v.id, is_published: !v.is_published }),
    })
    setLoading(null)
    router.refresh()
  }

  const formatDuration = (sec: number | null) => {
    if (!sec) return ''
    const min = Math.round(sec / 60)
    return min >= 60 ? `${(min / 60).toFixed(1)}h` : `${min} Min.`
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/content/modules" className="text-xs text-muted hover:text-foreground inline-flex items-center gap-1 mb-3">
          <ChevronLeft size={14} /> Zurück zu allen Modulen
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{module.emoji}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{module.title}</h1>
            <p className="text-sm text-muted">{videos.length} Videos · {module.description}</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus size={16} />
            Video hinzufügen
          </button>
        </div>
      </div>

      {/* Videos */}
      {videos.length === 0 ? (
        <div className="card-static p-8 text-center">
          <VideoIcon size={32} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">Noch keine Videos in diesem Modul.</p>
          <button onClick={() => setShowAdd(true)} className="btn-ghost border border-border mt-3 inline-flex">
            <Plus size={14} /> Erstes Video hinzufügen
          </button>
        </div>
      ) : (
        <div className="card-static overflow-hidden">
          <div className="divide-y divide-border">
            {videos.map((v, i) => (
              <div key={v.id} className="px-5 py-4 flex items-start gap-3">
                <span className="text-xs text-muted font-mono w-6 text-right shrink-0 pt-0.5">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-foreground">{v.title}</h3>
                    {!v.is_published && (
                      <span className="text-xs px-1.5 py-0.5 bg-muted/10 text-muted rounded">Entwurf</span>
                    )}
                    {v.duration_seconds && (
                      <span className="text-xs text-muted">{formatDuration(v.duration_seconds)}</span>
                    )}
                  </div>
                  {v.description && (
                    <p className="text-xs text-muted line-clamp-2">{v.description}</p>
                  )}
                  <p className="text-xs text-muted-light mt-1 font-mono">Wistia: {v.wistia_hashed_id}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleTogglePublish(v)}
                    className="p-1.5 text-muted hover:text-foreground hover:bg-surface-hover rounded-[var(--radius-sm)]"
                  >
                    {v.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => setEditing(v)} className="p-1.5 text-muted hover:text-foreground hover:bg-surface-hover rounded-[var(--radius-sm)]">
                    <Edit size={14} />
                  </button>
                  {confirmDelete === v.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(v.id)}
                        disabled={loading === v.id}
                        className="text-xs bg-danger text-white px-2 py-1 rounded-[var(--radius-sm)]"
                      >
                        {loading === v.id ? '...' : 'OK'}
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-muted px-1">×</button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(v.id)}
                      className="p-1.5 text-danger hover:bg-danger/10 rounded-[var(--radius-sm)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <AddVideoModal
          moduleId={module.id}
          onSave={handleSave}
          onClose={() => setShowAdd(false)}
          saving={loading === 'save'}
          existingCount={videos.length}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <EditVideoModal
          video={editing}
          allModules={allModules}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          saving={loading === 'save'}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ADD VIDEO MODAL — searches Wistia + assigns
// ═══════════════════════════════════════════════════════════

function AddVideoModal({
  moduleId,
  onSave,
  onClose,
  saving,
  existingCount,
}: {
  moduleId: string
  onSave: (v: Partial<ModuleVideo>) => void
  onClose: () => void
  saving: boolean
  existingCount: number
}) {
  const [wistiaVideos, setWistiaVideos] = useState<WistiaVideo[]>([])
  const [assigned, setAssigned] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/wistia-videos').then(r => r.json()).then(d => {
      setWistiaVideos(d.videos ?? [])
      setAssigned(d.assigned ?? {})
      setLoading(false)
    })
  }, [])

  const filtered = wistiaVideos.filter(v => v.title.toLowerCase().includes(search.toLowerCase()))

  const handleAdd = (video: WistiaVideo) => {
    onSave({
      wistia_hashed_id: video.hashedId,
      title: video.title,
      duration_seconds: video.duration,
      sort_order: existingCount + 1,
      description: '',
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card-static p-0 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Wistia-Video hinzufügen</h2>
          <button onClick={onClose} className="p-1 text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 bg-surface-secondary rounded-[var(--radius-md)] px-3 py-2">
            <Search size={14} className="text-muted shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Video suchen..."
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted"
            />
            {!loading && <span className="text-xs text-muted">{filtered.length}</span>}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-muted">
              <Loader2 size={20} className="animate-spin mx-auto mb-2" />
              <p className="text-sm">Lade Wistia-Videos...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">Keine Videos gefunden.</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(v => {
                const isAssigned = assigned[v.hashedId]
                const isThisModule = isAssigned === moduleId
                return (
                  <button
                    key={v.hashedId}
                    onClick={() => !isAssigned && handleAdd(v)}
                    disabled={!!isAssigned || saving}
                    className={`w-full px-5 py-3 flex items-center gap-3 text-left transition-colors ${
                      isThisModule
                        ? 'bg-primary/10 cursor-not-allowed'
                        : isAssigned
                        ? 'bg-surface-secondary opacity-50 cursor-not-allowed'
                        : 'hover:bg-surface-hover'
                    }`}
                  >
                    {v.thumbnail && (
                      <img src={v.thumbnail} alt="" className="w-16 h-9 object-cover rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{v.title}</p>
                      <p className="text-xs text-muted">
                        {Math.round(v.duration / 60)} Min.
                        {isThisModule && ' · Bereits in diesem Modul'}
                        {isAssigned && !isThisModule && ' · Bereits einem anderen Modul zugeordnet'}
                      </p>
                    </div>
                    {!isAssigned && <Plus size={16} className="text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// EDIT VIDEO MODAL
// ═══════════════════════════════════════════════════════════

function EditVideoModal({
  video,
  allModules,
  onSave,
  onClose,
  saving,
}: {
  video: ModuleVideo
  allModules: Module[]
  onSave: (v: Partial<ModuleVideo>) => void
  onClose: () => void
  saving: boolean
}) {
  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description)
  const [sortOrder, setSortOrder] = useState(video.sort_order)
  const [moduleId, setModuleId] = useState(video.module_id)
  const [isPublished, setIsPublished] = useState(video.is_published)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card-static p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-foreground mb-4">Video bearbeiten</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Beschreibung (Markdown)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={10}
              placeholder="Hier kann eine ausführliche Beschreibung mit Markdown stehen..."
              className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted mb-1.5">Modul</label>
              <select
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {allModules.map(m => (
                  <option key={m.id} value={m.id}>{m.emoji} {m.title}</option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-muted mb-1.5">Reihenfolge</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Wistia ID</label>
            <input
              type="text"
              value={video.wistia_hashed_id}
              disabled
              className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-surface-secondary text-sm font-mono text-muted"
            />
          </div>

          <button
            onClick={() => setIsPublished(!isPublished)}
            className={`w-full px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
              isPublished ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-surface-secondary text-muted'
            }`}
          >
            {isPublished ? '✓ Veröffentlicht' : '○ Entwurf'}
          </button>

          <div className="flex gap-2 pt-3 border-t border-border">
            <button onClick={onClose} className="btn-ghost border border-border flex-1 justify-center">
              Abbrechen
            </button>
            <button
              onClick={() => onSave({
                id: video.id,
                title: title.trim(),
                description,
                sort_order: sortOrder,
                module_id: moduleId,
                is_published: isPublished,
              })}
              disabled={saving || !title.trim()}
              className="btn-primary flex-1 justify-center disabled:opacity-50"
            >
              {saving ? <><Loader2 size={14} className="animate-spin" /> Speichere...</> : <><Save size={14} /> Speichern</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
