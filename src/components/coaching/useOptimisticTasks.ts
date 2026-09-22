'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Task, TaskStatus } from '@/lib/coaching/types'

type Minimal = Pick<Task, 'id' | 'status'>

/**
 * Haken reagieren sofort: Zustand wird lokal gesetzt, der Server im Hintergrund nachgezogen.
 * Fünf Sekunden „Rückgängig“, danach ein stiller Refresh. Schlägt der Server fehl, springt der
 * Zustand zurück und der Fehler wird gemeldet.
 */
export function useOptimisticTasks<T extends Minimal>(tasks: T[], opts: { refreshAfter?: boolean } = {}) {
  const router = useRouter()
  const [override, setOverride] = useState<Record<string, TaskStatus>>({})
  const [undoable, setUndoable] = useState<Record<string, TaskStatus>>({})
  const [error, setError] = useState<string | null>(null)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const display = useMemo(() => tasks.map((t) => (override[t.id] ? { ...t, status: override[t.id] } : t)), [tasks, override])

  function clearTimer(id: string) {
    if (timers.current[id]) { clearTimeout(timers.current[id]); delete timers.current[id] }
  }

  async function setStatus(task: T, status: TaskStatus) {
    const prev = override[task.id] ?? task.status
    setError(null)
    setOverride((o) => ({ ...o, [task.id]: status }))
    setUndoable((u) => ({ ...u, [task.id]: prev }))
    clearTimer(task.id)
    timers.current[task.id] = setTimeout(() => {
      setUndoable((u) => { const n = { ...u }; delete n[task.id]; return n })
      if (opts.refreshAfter !== false) router.refresh()
    }, 5000)
    const res = await fetch('/api/admin/coaching/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: task.id, status }) })
    if (!res.ok) {
      clearTimer(task.id)
      setOverride((o) => ({ ...o, [task.id]: prev }))
      setUndoable((u) => { const n = { ...u }; delete n[task.id]; return n })
      setError('Konnte nicht speichern. Bitte noch einmal.')
    }
  }

  function undo(task: T) {
    const prev = undoable[task.id]
    if (prev === undefined) return
    clearTimer(task.id)
    setUndoable((u) => { const n = { ...u }; delete n[task.id]; return n })
    setOverride((o) => ({ ...o, [task.id]: prev }))
    void fetch('/api/admin/coaching/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: task.id, status: prev }) })
  }

  return { display, setStatus, undo, canUndo: (id: string) => id in undoable, error }
}
