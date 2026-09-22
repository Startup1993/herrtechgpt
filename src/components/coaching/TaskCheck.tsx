'use client'

import { Check } from 'lucide-react'

/** Runder Haken, der sofort reagiert. Zustand kommt von außen (useOptimisticTasks). */
export function TaskCheck({ done, onToggle, size = 18, label = 'Erledigt' }: { done: boolean; onToggle: () => void; size?: number; label?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle() }}
      aria-pressed={done}
      aria-label={label}
      style={{ width: size, height: size }}
      className={`grid shrink-0 place-items-center rounded-full border-2 transition-colors duration-150 ${done ? 'bg-success border-success text-white' : 'border-border hover:border-primary bg-transparent'}`}
    >
      {done && <Check size={Math.round(size * 0.6)} strokeWidth={3} />}
    </button>
  )
}
