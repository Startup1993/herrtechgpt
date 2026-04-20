'use client'

import { Film } from 'lucide-react'

export default function AdminVideosPage() {
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Video-Sync</h1>
        <p className="text-sm text-muted">Wistia-Sync-Status und Transkriptionen.</p>
      </div>

      <div className="card-static p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Film size={32} className="text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Video-Sync Übersicht</h2>
        <p className="text-sm text-muted max-w-md mx-auto mb-4">
          Videos werden automatisch über den Wistia-Cron-Job synchronisiert und transkribiert.
        </p>
        <code className="text-xs bg-surface-secondary px-3 py-1.5 rounded-[var(--radius-md)] text-muted">
          /api/cron/wistia-sync
        </code>
      </div>
    </div>
  )
}
