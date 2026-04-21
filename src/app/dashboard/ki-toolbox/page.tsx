'use client'

import { ArrowRight, Palette, Film, Video, Clock } from 'lucide-react'

const tools = [
  {
    id: 'carousel',
    icon: Palette,
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600',
    title: 'Karussell-Generator',
    subtitle: 'Pay-per-Use',
    description: 'Instagram-Karussell-Slides aus deinem Text.',
  },
  {
    id: 'video-editor',
    icon: Film,
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    title: 'KI Video Editor',
    subtitle: 'Pay-per-Use',
    description: 'KI analysiert Szenen und schlägt Schnitte vor.',
  },
  {
    id: 'video-creator',
    icon: Video,
    iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
    title: 'KI Video Creator',
    subtitle: 'Pay-per-Use',
    description: 'Komplettes Video-Skript aus einer Beschreibung.',
  },
]

export default function KiToolboxPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="w-full max-w-3xl text-center mb-10">
        <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <Clock size={12} /> Coming Soon
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          KI Toolbox
        </h1>
        <p className="text-muted text-sm sm:text-base max-w-lg mx-auto">
          Praktische KI-Tools für Content-Erstellung — bald verfügbar als
          Pay-per-Use für alle Nutzer. Die Preise legen wir aktuell fest.
        </p>
      </div>

      {/* Tool Cards */}
      <div className="w-full max-w-4xl">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4 text-center">
          Bald verfügbar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="card-static relative flex flex-col p-6 opacity-80"
            >
              <div className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                <Clock size={10} /> Coming Soon
              </div>
              <div className={`w-12 h-12 rounded-[var(--radius-xl)] ${tool.iconBg} flex items-center justify-center mb-4`}>
                <tool.icon size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{tool.title}</h3>
              <p className="text-xs text-muted mb-3">{tool.subtitle}</p>
              <p className="text-sm text-foreground/80 leading-relaxed flex-1 mb-4">{tool.description}</p>
              <div className="flex items-center gap-2 text-sm font-medium text-muted">
                Noch nicht verfügbar
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
