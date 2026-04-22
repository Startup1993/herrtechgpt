'use client'

import Link from 'next/link'
import { ChevronLeft, Wrench, CheckCircle2 } from 'lucide-react'

export default function ScenesPlaceholder({ projectId }: { projectId: string }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/ki-toolbox/video-creator"
          className="text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projekt</h1>
          <p className="text-xs text-muted font-mono">{projectId}</p>
        </div>
      </div>

      <div className="card-static p-6 mb-4 border-emerald-200 dark:border-emerald-900/40">
        <div className="flex gap-3">
          <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Projekt wurde erfolgreich angelegt
            </h3>
            <p className="text-sm text-muted">
              Dein Projekt ist im Worker gespeichert. Der Szenen-Editor wird
              gerade portiert und in einem nächsten Update freigeschaltet.
            </p>
          </div>
        </div>
      </div>

      <div className="card-static p-6">
        <div className="flex gap-3">
          <Wrench size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Szenen-Editor kommt in Kürze
            </h3>
            <p className="text-sm text-muted leading-relaxed mb-3">
              Der vollständige Editor (1960 Zeilen UI mit Bild-Generierung,
              Video-Generierung, Character-Management, Split/Insert/Reorder)
              wird im nächsten Release portiert.
            </p>
            <p className="text-sm text-muted leading-relaxed">
              Was schon funktioniert: Projekt-Erstellung via Prompt, Upload
              und URL. Die Daten liegen sicher auf dem Worker.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link
          href="/dashboard/ki-toolbox/video-creator"
          className="btn-ghost border border-border"
        >
          <ChevronLeft size={14} />
          Zurück zur Übersicht
        </Link>
      </div>
    </div>
  )
}
