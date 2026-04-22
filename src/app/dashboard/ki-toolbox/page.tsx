'use client'

import Link from 'next/link'
import { ArrowRight, Palette, Film, Video, Clock, Sparkles } from 'lucide-react'

interface Tool {
  id: string
  icon: typeof Palette
  iconBg: string
  title: string
  subtitle: string
  description: string
  href?: string
  comingSoon?: boolean
}

const tools: Tool[] = [
  {
    id: 'video-creator',
    icon: Video,
    iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
    title: 'KI Video Creator',
    subtitle: 'Premium',
    description:
      'Komplette KI-Videos aus Prompt, URL oder Upload. Szenen, Bilder, Voiceover, Export.',
    href: '/dashboard/ki-toolbox/video-creator',
  },
  {
    id: 'carousel',
    icon: Palette,
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600',
    title: 'Karussell-Generator',
    subtitle: 'Pay-per-Use',
    description: 'Instagram-Karussell-Slides aus deinem Text.',
    href: '/dashboard/ki-toolbox/carousel',
  },
  {
    id: 'video-editor',
    icon: Film,
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    title: 'KI Video Editor',
    subtitle: 'Pay-per-Use',
    description: 'KI analysiert Szenen und schlägt Schnitte vor.',
    comingSoon: true,
  },
]

export default function KiToolboxPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles size={12} /> KI Toolbox
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Deine KI-Werkzeugkiste
        </h1>
        <p className="text-muted text-sm sm:text-base max-w-lg mx-auto">
          Praktische KI-Tools für Content-Erstellung. Neue Tools folgen laufend.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tools.map((tool) => {
          const cardInner = (
            <>
              {tool.comingSoon && (
                <div className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                  <Clock size={10} /> Coming Soon
                </div>
              )}
              <div
                className={`w-12 h-12 rounded-[var(--radius-xl)] ${tool.iconBg} flex items-center justify-center mb-4`}
              >
                <tool.icon size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {tool.title}
              </h3>
              <p className="text-xs text-muted mb-3">{tool.subtitle}</p>
              <p className="text-sm text-foreground/80 leading-relaxed flex-1 mb-4">
                {tool.description}
              </p>
              <div
                className={`flex items-center gap-2 text-sm font-medium ${
                  tool.comingSoon ? 'text-muted' : 'text-primary'
                }`}
              >
                {tool.comingSoon ? 'Noch nicht verfügbar' : 'Jetzt öffnen'}
                <ArrowRight size={14} />
              </div>
            </>
          )

          if (tool.comingSoon || !tool.href) {
            return (
              <div
                key={tool.id}
                className="card-static relative flex flex-col p-6 opacity-80"
              >
                {cardInner}
              </div>
            )
          }

          return (
            <Link
              key={tool.id}
              href={tool.href}
              className="card-static relative flex flex-col p-6 hover:shadow-lg hover:border-primary/30 transition-all group"
            >
              {cardInner}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
