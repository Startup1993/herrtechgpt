'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { GraduationCap, Bot, Wrench, ArrowRight, Sparkles, Play, Zap } from 'lucide-react'

// ═══════════════════════════════════════════════════════════
// DASHBOARD TILE
// ═══════════════════════════════════════════════════════════

function DashboardTile({
  href,
  icon: Icon,
  iconBg,
  title,
  subtitle,
  description,
  features,
  ctaLabel,
  locked,
}: {
  href: string
  icon: React.ElementType
  iconBg: string
  title: string
  subtitle: string
  description: string
  features: string[]
  ctaLabel: string
  locked?: boolean
}) {
  return (
    <Link
      href={href}
      className="card group relative flex flex-col p-6 min-h-[280px] overflow-hidden"
    >
      {/* Locked overlay */}
      {locked && (
        <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-[2px] flex items-center justify-center rounded-[var(--radius-2xl)]">
          <span className="px-4 py-2 bg-primary/15 text-primary text-sm font-semibold rounded-full">
            Premium
          </span>
        </div>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-[var(--radius-xl)] ${iconBg} flex items-center justify-center mb-4`}>
        <Icon size={24} className="text-white" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted mb-4">{subtitle}</p>

      {/* Description */}
      <p className="text-sm text-foreground/80 mb-4 leading-relaxed">{description}</p>

      {/* Features */}
      <ul className="space-y-1.5 mb-6 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-muted">
            <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
        {ctaLabel}
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
}

// ═══════════════════════════════════════════════════════════
// LEARNING PATH WIDGET
// ═══════════════════════════════════════════════════════════

function LearningPathWidget() {
  const [path, setPath] = useState<{ videos?: unknown[]; milestones?: unknown[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch learning path from profile
    fetch('/api/onboarding/path')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setPath(data))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="card-static p-6 animate-pulse">
        <div className="h-4 bg-surface-secondary rounded w-48 mb-3" />
        <div className="h-2 bg-surface-secondary rounded w-full" />
      </div>
    )
  }

  if (!path) {
    return (
      <div className="card-static p-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles size={20} className="text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Dein persönlicher Lernpfad</h3>
          <p className="text-sm text-muted">Starte das Onboarding-Quiz und erhalte personalisierte Empfehlungen.</p>
        </div>
        <Link
          href="/dashboard/onboarding"
          className="btn-primary shrink-0"
        >
          Onboarding beginnen
        </Link>
      </div>
    )
  }

  return (
    <Link href="/dashboard/path" className="card-static p-6 flex items-center gap-4 hover:bg-surface-hover transition-colors group">
      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
        <Play size={18} className="text-success" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground">Dein Lernpfad</h3>
        <p className="text-sm text-muted truncate">
          {path.videos ? `${(path.videos as unknown[]).length} Videos empfohlen` : 'Fortschritt anzeigen'}
        </p>
      </div>
      <ArrowRight size={16} className="text-muted group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0" />
    </Link>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Willkommen bei Herr Tech
          </h1>
          <Zap size={24} className="text-primary" />
        </div>
        <p className="text-muted text-sm sm:text-base">
          Deine All-in-One KI-Plattform für Content, Business & Wachstum.
        </p>
      </div>

      {/* Learning Path Widget */}
      <div className="mb-8">
        <LearningPathWidget />
      </div>

      {/* Main Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        <DashboardTile
          href="/dashboard/classroom"
          icon={GraduationCap}
          iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
          title="Classroom"
          subtitle="Lernvideos & Tutorials"
          description="Alle Lernvideos zu KI, Content-Erstellung, Funnels und Online-Business."
          features={['Kategorisierte Videos', 'Suchfunktion', 'Alle Themen abgedeckt']}
          ctaLabel="Videos ansehen"
        />

        <DashboardTile
          href="/dashboard/herr-tech-gpt"
          icon={Bot}
          iconBg="bg-gradient-to-br from-[#B598E2] to-[#9b51e0]"
          title="Herr Tech GPT"
          subtitle="Dein KI-Assistent"
          description="6 spezialisierte KI-Agenten mit dem gesamten Wissen aus allen Lernvideos."
          features={['Content & Hook Agent', 'Business Coach', 'Prompt Engineer']}
          ctaLabel="Chat starten"
        />

        <DashboardTile
          href="/dashboard/ki-toolbox"
          icon={Wrench}
          iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
          title="KI Toolbox"
          subtitle="KI-Workflows & Tools"
          description="Praktische KI-Tools: Karussell-Generator, Video-Editor und mehr."
          features={['Karussell-Generator', 'KI Video Editor', 'KI Video Creator']}
          ctaLabel="Tools entdecken"
        />
      </div>

      {/* Footer */}
      <div className="card-static p-6 text-center">
        <p className="text-lg font-semibold text-foreground mb-1">
          Viel Spaß beim Erstellen! 🚀
        </p>
        <p className="text-sm text-muted mb-4">
          Wenn du Fragen oder Probleme hast, wende dich gern an unseren Support.
        </p>
        <Link
          href="/dashboard/help"
          className="btn-ghost inline-flex items-center gap-2 border border-border"
        >
          Support kontaktieren
        </Link>
      </div>
    </div>
  )
}
