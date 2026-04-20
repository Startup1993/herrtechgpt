'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Plus, Edit, Trash2, Eye, EyeOff, Search, Loader2, X,
  Video as VideoIcon, Save, GripVertical, FileText, Link as LinkIcon,
  Image as ImageIcon, Film,
} from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { RichTextEditor } from '@/components/rich-text-editor'

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

interface VideoResource {
  id: string
  video_id: string
  title: string
  url: string
  resource_type: string
  sort_order: number
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
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => setVideos(initialVideos), [initialVideos])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

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
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1500)
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

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = videos.findIndex(v => v.id === active.id)
    const newIndex = videos.findIndex(v => v.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(videos, oldIndex, newIndex)
    // Assign new sort_order values (1-indexed)
    const renumbered = next.map((v, i) => ({ ...v, sort_order: i + 1 }))
    setVideos(renumbered)
    await fetch('/api/admin/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'module_videos',
        items: renumbered.map(v => ({ id: v.id, sort_order: v.sort_order })),
      }),
    })
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
            <p className="text-sm text-muted">
              {videos.length} Videos · {module.description}
              {savedFlash && <span className="ml-2 text-primary">· Gespeichert ✓</span>}
            </p>
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={videos.map(v => v.id)} strategy={verticalListSortingStrategy}>
              <ul className="divide-y divide-border">
                {videos.map((v, i) => (
                  <SortableVideoRow
                    key={v.id}
                    video={v}
                    index={i}
                    onEdit={() => setEditing(v)}
                    onTogglePublish={() => handleTogglePublish(v)}
                    onDelete={() => handleDelete(v.id)}
                    confirmingDelete={confirmDelete === v.id}
                    setConfirmingDelete={(c) => setConfirmDelete(c ? v.id : null)}
                    loading={loading === v.id}
                    formatDuration={formatDuration}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
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
// SORTABLE ROW
// ═══════════════════════════════════════════════════════════

function SortableVideoRow({
  video,
  index,
  onEdit,
  onTogglePublish,
  onDelete,
  confirmingDelete,
  setConfirmingDelete,
  loading,
  formatDuration,
}: {
  video: ModuleVideo
  index: number
  onEdit: () => void
  onTogglePublish: () => void
  onDelete: () => void
  confirmingDelete: boolean
  setConfirmingDelete: (c: boolean) => void
  loading: boolean
  formatDuration: (s: number | null) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: video.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`px-5 py-4 flex items-start gap-3 bg-background ${isDragging ? 'z-10 shadow-lg' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted hover:text-foreground touch-none cursor-grab active:cursor-grabbing p-0.5"
        aria-label="Verschieben"
      >
        <GripVertical size={16} />
      </button>
      <span className="text-xs text-muted font-mono w-6 text-right shrink-0 pt-0.5">{index + 1}.</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-foreground">{video.title}</h3>
          {!video.is_published && (
            <span className="text-xs px-1.5 py-0.5 bg-muted/10 text-muted rounded">Entwurf</span>
          )}
          {(video.duration_seconds ?? 0) > 0 && (
            <span className="text-xs text-muted">{formatDuration(video.duration_seconds)}</span>
          )}
        </div>
        {video.description && (
          <p className="text-xs text-muted line-clamp-2">{video.description.replace(/[*#_`>-]/g, '').slice(0, 200)}</p>
        )}
        <p className="text-xs text-muted-light mt-1 font-mono">Wistia: {video.wistia_hashed_id}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onTogglePublish} className="p-1.5 text-muted hover:text-foreground hover:bg-surface-hover rounded-[var(--radius-sm)]">
          {video.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button onClick={onEdit} className="p-1.5 text-muted hover:text-foreground hover:bg-surface-hover rounded-[var(--radius-sm)]">
          <Edit size={14} />
        </button>
        {confirmingDelete ? (
          <>
            <button
              onClick={onDelete}
              disabled={loading}
              className="text-xs bg-danger text-white px-2 py-1 rounded-[var(--radius-sm)]"
            >
              {loading ? '...' : 'OK'}
            </button>
            <button onClick={() => setConfirmingDelete(false)} className="text-xs text-muted px-1">×</button>
          </>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="p-1.5 text-danger hover:bg-danger/10 rounded-[var(--radius-sm)]"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </li>
  )
}

// ═══════════════════════════════════════════════════════════
// ADD VIDEO MODAL
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
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Wistia-Video hinzufügen</h2>
          <button onClick={onClose} className="p-1 text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>
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
// EDIT VIDEO MODAL (WYSIWYG + Resources)
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
  const [moduleId, setModuleId] = useState(video.module_id)
  const [isPublished, setIsPublished] = useState(video.is_published)
  const [wistiaId, setWistiaId] = useState(video.wistia_hashed_id)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card-static p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Video bearbeiten</h2>
          <button onClick={onClose} className="p-1 text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

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
            <label className="block text-xs font-medium text-muted mb-1.5">Beschreibung</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Hier kann eine ausführliche Beschreibung stehen. Bilder per Upload-Button oder Paste einfügen."
              minHeight={200}
            />
          </div>

          <div>
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

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Wistia Video-ID oder URL</label>
            <input
              type="text"
              value={wistiaId}
              onChange={(e) => {
                const val = e.target.value.trim()
                const match = val.match(/wistia\.(?:com|net)\/(?:medias|embed\/iframe|embed\/channel\/\w+\/iframe)\/([a-z0-9]{10})/i)
                setWistiaId(match ? match[1] : val)
              }}
              placeholder="abc123xyz0 oder https://wistia.com/medias/abc123xyz0"
              className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted mt-1">
              {/^[a-z0-9]{10}$/i.test(wistiaId) ? '✓ Gültige Wistia-ID' :
               wistiaId === 'MISSING___' || !wistiaId ? '⚠ Kein Video — Lektion zeigt nur Beschreibung' :
               '⚠ Keine gültige 10-stellige Wistia-ID'}
            </p>
          </div>

          {/* RESOURCES */}
          <ResourcesEditor videoId={video.id} />

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
                module_id: moduleId,
                is_published: isPublished,
                wistia_hashed_id: wistiaId || 'MISSING___',
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

// ═══════════════════════════════════════════════════════════
// RESOURCES EDITOR
// ═══════════════════════════════════════════════════════════

function resourceIcon(type: string) {
  switch (type) {
    case 'pdf': return <FileText size={14} className="text-red-500" />
    case 'image': return <ImageIcon size={14} className="text-primary" />
    case 'video': return <Film size={14} className="text-blue-500" />
    default: return <LinkIcon size={14} className="text-muted" />
  }
}

function ResourcesEditor({ videoId }: { videoId: string }) {
  const [resources, setResources] = useState<VideoResource[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')

  const load = async () => {
    const res = await fetch(`/api/admin/video-resources?videoId=${videoId}`)
    const data = await res.json()
    setResources(data.resources ?? [])
    setLoading(false)
  }

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [videoId])

  const handleAdd = async () => {
    if (!newTitle.trim() || !newUrl.trim()) return
    setAdding(true)
    await fetch('/api/admin/video-resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_id: videoId,
        title: newTitle.trim(),
        url: newUrl.trim(),
        sort_order: resources.length + 1,
      }),
    })
    setNewTitle('')
    setNewUrl('')
    setAdding(false)
    load()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/video-resources?id=${id}`, { method: 'DELETE' })
    setResources(resources.filter(r => r.id !== id))
  }

  return (
    <div className="border border-border rounded-[var(--radius-md)] p-3 bg-surface-secondary/40">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-muted">Resources (PDFs, Links)</label>
        <span className="text-xs text-muted">{resources.length}</span>
      </div>

      {loading ? (
        <div className="text-xs text-muted py-2"><Loader2 size={12} className="inline animate-spin mr-1" /> Lade...</div>
      ) : resources.length === 0 ? (
        <p className="text-xs text-muted py-1">Noch keine Resources angehängt.</p>
      ) : (
        <ul className="space-y-1.5 mb-2">
          {resources.map(r => (
            <li key={r.id} className="flex items-center gap-2 text-xs bg-background border border-border rounded-[var(--radius-sm)] px-2 py-1.5">
              {resourceIcon(r.resource_type)}
              <a href={r.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-foreground hover:text-primary">
                {r.title}
              </a>
              <span className="text-[10px] text-muted-light uppercase">{r.resource_type}</span>
              <button onClick={() => handleDelete(r.id)} className="p-1 text-danger hover:bg-danger/10 rounded-[var(--radius-sm)]">
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-1.5">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Titel"
          className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-border rounded-[var(--radius-sm)] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <input
          type="text"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="URL (PDF, Link, Bild…)"
          className="flex-[2] min-w-0 px-2 py-1.5 text-xs border border-border rounded-[var(--radius-sm)] bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newTitle.trim() || !newUrl.trim()}
          className="px-2 py-1.5 text-xs bg-primary text-white rounded-[var(--radius-sm)] disabled:opacity-40 inline-flex items-center gap-1"
        >
          {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        </button>
      </div>
    </div>
  )
}
