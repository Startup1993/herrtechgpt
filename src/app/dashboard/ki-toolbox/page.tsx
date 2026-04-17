'use client'

import Link from 'next/link'
import { ArrowRight, Palette, Film, Video } from 'lucide-react'

const tools = [
  {
    id: 'carousel',
    icon: Palette,
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600',
    title: 'Karussell-Generator',
    subtitle: '~1 Minute • Einfach',
    description: 'Erstelle professionelle Instagram-Karussell-Slides aus deinem Text. Inkl. CI-Farben und sofortigem Download.',
    href: '/dashboard/ki-toolbox/carousel',
    ready: true,
  },
  {
    id: 'video-editor',
    icon: Film,
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    title: 'KI Video Editor',
    subtitle: 'Upload → Analyse → fertig',
    description: 'Füge dein Transkript ein. KI analysiert Szenen und schlägt automatische Schnitte vor.',
    href: '/dashboard/ki-toolbox/video-editor',
    ready: true,
  },
  {
    id: 'video-creator',
    icon: Video,
    iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
    title: 'KI Video Creator',
    subtitle: 'Text-Prompt → Video',
    description: 'Beschreibe dein Video per Text. KI erstellt ein komplettes Szenen-Skript mit Bildprompts.',
    href: '/dashboard/ki-toolbox/video-creator',
    ready: true,
  },
]

export default function KiToolboxPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          KI Toolbox
        </h1>
        <p className="text-muted text-sm sm:text-base">
          Praktische KI-Tools für Content-Erstellung. Wähle ein Tool und leg los.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            className={`card group flex flex-col p-6 ${!tool.ready ? 'opacity-70' : ''}`}
          >
            {/* Badge */}
            {!tool.ready && (
              <span className="absolute top-4 right-4 px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                Coming Soon
              </span>
            )}

            {/* Icon */}
            <div className={`w-12 h-12 rounded-[var(--radius-xl)] ${tool.iconBg} flex items-center justify-center mb-4`}>
              <tool.icon size={24} className="text-white" />
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-1">{tool.title}</h3>
            <p className="text-xs text-muted mb-3">{tool.subtitle}</p>
            <p className="text-sm text-foreground/80 leading-relaxed flex-1 mb-4">{tool.description}</p>

            <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
              {tool.ready ? 'Starten' : 'Bald verfügbar'}
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
