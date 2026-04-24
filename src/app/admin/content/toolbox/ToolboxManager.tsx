'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Clock } from 'lucide-react'
import {
  resolveToolboxIcon,
  TOOLBOX_ICON_NAMES,
  TOOLBOX_ICON_BG_PRESETS,
  type ToolboxTool,
} from '@/lib/toolbox-icons'

interface Props {
  initialTools: ToolboxTool[]
}

function emptyTool(nextSortOrder: number): ToolboxTool {
  return {
    id: '',
    title: '',
    subtitle: '',
    description: '',
    href: '',
    icon_name: 'Wrench',
    icon_bg: TOOLBOX_ICON_BG_PRESETS[0].value,
    sort_order: nextSortOrder,
    coming_soon: false,
    published: true,
  }
}

export default function ToolboxManager({ initialTools }: Props) {
  const router = useRouter()
  const [tools, setTools] = useState<ToolboxTool[]>(initialTools)
  const [editing, setEditing] = useState<ToolboxTool | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  async function persistOrder(next: ToolboxTool[]) {
    await fetch('/api/admin/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'toolbox_tools',
        items: next.map((t) => ({ id: t.id, sort_order: t.sort_order })),
      }),
    })
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
    router.refresh()
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = tools.findIndex((t) => t.id === active.id)
    const newIndex = tools.findIndex((t) => t.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(tools, oldIndex, newIndex).map((t, i) => ({
      ...t,
      sort_order: (i + 1) * 10,
    }))
    setTools(next)
    await persistOrder(next)
  }

  async function handleSave(tool: ToolboxTool) {
    const res = await fetch('/api/admin/toolbox-tools', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tool),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.error ?? 'Fehler beim Speichern')
      return
    }
    const saved = (await res.json()) as ToolboxTool
    setTools((prev) => {
      const exists = prev.some((t) => t.id === saved.id)
      const next = exists
        ? prev.map((t) => (t.id === saved.id ? saved : t))
        : [...prev, saved]
      return next.sort((a, b) => a.sort_order - b.sort_order)
    })
    setEditing(null)
    setIsNew(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm(`Tool „${id}" wirklich löschen?`)) return
    const res = await fetch(`/api/admin/toolbox-tools?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.error ?? 'Fehler beim Löschen')
      return
    }
    setTools((prev) => prev.filter((t) => t.id !== id))
    setEditing(null)
    router.refresh()
  }

  async function handleTogglePublished(tool: ToolboxTool) {
    await handleSave({ ...tool, published: !tool.published })
  }

  async function handleToggleComingSoon(tool: ToolboxTool) {
    await handleSave({ ...tool, coming_soon: !tool.coming_soon })
  }

  function handleAdd() {
    const maxSort = tools.reduce((m, t) => Math.max(m, t.sort_order), 0)
    setEditing(emptyTool(maxSort + 10))
    setIsNew(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          {savedFlash ? 'Reihenfolge gespeichert.' : `${tools.length} Tools`}
        </p>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          + Neues Tool
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tools.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tools.map((tool) => (
              <ToolRow
                key={tool.id}
                tool={tool}
                onEdit={() => { setEditing({ ...tool }); setIsNew(false) }}
                onTogglePublished={() => handleTogglePublished(tool)}
                onToggleComingSoon={() => handleToggleComingSoon(tool)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {tools.length === 0 && (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <p className="text-muted">Noch keine Tools angelegt.</p>
        </div>
      )}

      {editing && (
        <ToolEditModal
          tool={editing}
          isNew={isNew}
          onSave={handleSave}
          onDelete={isNew ? undefined : () => handleDelete(editing.id)}
          onClose={() => { setEditing(null); setIsNew(false) }}
        />
      )}
    </div>
  )
}

function ToolRow({
  tool,
  onEdit,
  onTogglePublished,
  onToggleComingSoon,
}: {
  tool: ToolboxTool
  onEdit: () => void
  onTogglePublished: () => void
  onToggleComingSoon: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tool.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  const Icon = resolveToolboxIcon(tool.icon_name)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-surface border border-border rounded-xl p-4 flex items-center gap-4 ${
        !tool.published ? 'opacity-50' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 text-muted hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
        aria-label="Verschieben"
      >
        <GripVertical size={18} />
      </button>

      <div
        className={`w-10 h-10 rounded-xl ${tool.icon_bg} flex items-center justify-center shrink-0`}
      >
        <Icon size={20} className="text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-foreground">{tool.title}</h3>
          <code className="text-xs bg-surface-secondary text-muted px-1.5 py-0.5 rounded">
            {tool.id}
          </code>
          {tool.coming_soon && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
              <Clock size={9} /> Coming Soon
            </span>
          )}
          {!tool.published && (
            <span className="text-xs bg-surface-secondary text-muted px-2 py-0.5 rounded-full">
              Unveröffentlicht
            </span>
          )}
        </div>
        <p className="text-sm text-muted mt-1 truncate">{tool.description}</p>
      </div>

      <div className="shrink-0 flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-muted select-none cursor-pointer">
          <span>Published</span>
          <Switch checked={tool.published} onClick={onTogglePublished} />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted select-none cursor-pointer">
          <span>Coming Soon</span>
          <Switch checked={tool.coming_soon} onClick={onToggleComingSoon} />
        </label>
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-surface-secondary transition-colors text-foreground"
        >
          Bearbeiten
        </button>
      </div>
    </div>
  )
}

function Switch({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onClick}
      className={`relative w-9 h-5 rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-border'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function ToolEditModal({
  tool,
  isNew,
  onSave,
  onDelete,
  onClose,
}: {
  tool: ToolboxTool
  isNew: boolean
  onSave: (tool: ToolboxTool) => void | Promise<void>
  onDelete?: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState<ToolboxTool>(tool)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      ...form,
      subtitle: form.subtitle?.trim() || null,
      href: form.href?.trim() || null,
    })
    setSaving(false)
  }

  const IconPreview = resolveToolboxIcon(form.icon_name)

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {isNew ? 'Neues Tool' : `${form.title} bearbeiten`}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:text-foreground p-1"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-[1fr_1fr] gap-3">
            <Field label="ID (slug)">
              <input
                type="text"
                value={form.id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                  })
                }
                required
                disabled={!isNew}
                placeholder="mein-tool"
                className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono disabled:opacity-60"
              />
            </Field>
            <Field label="Titel">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
            </Field>
          </div>

          <Field label="Subtitle (z.B. Premium, Pay-per-Use)">
            <input
              type="text"
              value={form.subtitle ?? ''}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="Premium"
              className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </Field>

          <Field label="Beschreibung">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={2}
              className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-y"
            />
          </Field>

          <Field label="Link (leer lassen wenn noch nicht verfügbar)">
            <input
              type="text"
              value={form.href ?? ''}
              onChange={(e) => setForm({ ...form, href: e.target.value })}
              placeholder="/dashboard/ki-toolbox/mein-tool"
              className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono"
            />
          </Field>

          <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
            <div
              className={`w-12 h-12 rounded-xl ${form.icon_bg} flex items-center justify-center`}
            >
              <IconPreview size={22} className="text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Icon">
                <select
                  value={form.icon_name}
                  onChange={(e) => setForm({ ...form, icon_name: e.target.value })}
                  className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                >
                  {TOOLBOX_ICON_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Farbe">
                <select
                  value={form.icon_bg}
                  onChange={(e) => setForm({ ...form, icon_bg: e.target.value })}
                  className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                >
                  {TOOLBOX_ICON_BG_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm text-foreground select-none cursor-pointer">
              <Switch
                checked={form.published}
                onClick={() => setForm({ ...form, published: !form.published })}
              />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground select-none cursor-pointer">
              <Switch
                checked={form.coming_soon}
                onClick={() => setForm({ ...form, coming_soon: !form.coming_soon })}
              />
              Coming Soon
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                >
                  Löschen
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-muted border border-border rounded-lg hover:bg-surface-secondary transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {saving ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted mb-1.5">{label}</span>
      {children}
    </label>
  )
}
