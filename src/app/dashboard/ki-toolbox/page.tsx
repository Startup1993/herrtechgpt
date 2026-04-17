'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Palette, Film, Video, Wrench, Send } from 'lucide-react'

const tools = [
  {
    id: 'carousel',
    icon: Palette,
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600',
    title: 'Karussell-Generator',
    subtitle: '~1 Minute • Einfach',
    description: 'Instagram-Karussell-Slides aus deinem Text.',
    href: '/dashboard/ki-toolbox/carousel',
    keywords: ['karussell', 'carousel', 'instagram', 'slides', 'post', 'social media', 'bild'],
  },
  {
    id: 'video-editor',
    icon: Film,
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    title: 'KI Video Editor',
    subtitle: 'Transkript → Analyse → Schnitt',
    description: 'KI analysiert Szenen und schlägt Schnitte vor.',
    href: '/dashboard/ki-toolbox/video-editor',
    keywords: ['video', 'editor', 'schnitt', 'schneiden', 'transkript', 'szene', 'cut'],
  },
  {
    id: 'video-creator',
    icon: Video,
    iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
    title: 'KI Video Creator',
    subtitle: 'Text-Prompt → Szenen-Skript',
    description: 'Komplettes Video-Skript aus einer Beschreibung.',
    href: '/dashboard/ki-toolbox/video-creator',
    keywords: ['video', 'creator', 'erstellen', 'generieren', 'skript', 'szenen', 'reel', 'short'],
  },
]

export default function KiToolboxPage() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  // Simple keyword matching for suggestions
  const suggestions = query.trim().length > 1
    ? tools.filter(t => t.keywords.some(k => query.toLowerCase().includes(k)))
    : []

  const handleSubmit = () => {
    if (suggestions.length > 0) {
      router.push(suggestions[0].href)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 sm:px-6 py-6 sm:py-10">
      {/* Centered Header + Smart Input */}
      <div className="w-full max-w-3xl text-center mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          KI Toolbox
        </h1>
        <p className="text-muted text-sm sm:text-base mb-6">
          Sag mir was du erstellen willst — ich schlage das passende Tool vor.
        </p>

        {/* Smart Input */}
        <div className="card-static p-4 flex items-center gap-3 text-left">
          <Wrench size={20} className="text-muted shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="z.B. Ich möchte ein Instagram-Karussell erstellen..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
          {suggestions.length > 0 && (
            <button onClick={handleSubmit} className="btn-primary px-3 py-2">
              <Send size={16} />
            </button>
          )}
        </div>

        {/* Suggestion */}
        {suggestions.length > 0 && (
          <div className="mt-3 flex justify-center gap-2">
            {suggestions.map(s => (
              <Link
                key={s.id}
                href={s.href}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
              >
                <s.icon size={12} />
                {s.title}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Tool Cards */}
      <div className="w-full max-w-4xl">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4 text-center">
          Verfügbare Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="card group flex flex-col p-6"
            >
              <div className={`w-12 h-12 rounded-[var(--radius-xl)] ${tool.iconBg} flex items-center justify-center mb-4`}>
                <tool.icon size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{tool.title}</h3>
              <p className="text-xs text-muted mb-3">{tool.subtitle}</p>
              <p className="text-sm text-foreground/80 leading-relaxed flex-1 mb-4">{tool.description}</p>
              <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                Starten
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
