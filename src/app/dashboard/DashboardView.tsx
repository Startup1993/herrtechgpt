'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  GraduationCap, Bot, Wrench, ArrowRight, Sparkles, Play, Zap,
  Lock, Clock, Check, Users
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { AccessTier } from '@/lib/access'
import type { FeatureKey, FeatureState, UpsellCopy } from '@/lib/permissions'

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
  lockLabel,
}: {
  href: string
  icon: React.ElementType
  iconBg: string
  title: string
  subtitle: string
  description: string
  features: string[]
  ctaLabel: string
  lockLabel?: string
}) {
  const locked = !!lockLabel
  return (
    <Link
      href={href}
      className="card group relative flex flex-col p-6 min-h-[280px] overflow-hidden"
    >
      {locked && (
        <div className="absolute inset-0 z-10 bg-surface/70 backdrop-blur-[2px] flex items-center justify-center rounded-[var(--radius-2xl)]">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/15 text-primary text-sm font-semibold rounded-full">
            <Lock size={14} />
            {lockLabel}
          </span>
        </div>
      )}

      <div className={`w-12 h-12 rounded-[var(--radius-xl)] ${iconBg} flex items-center justify-center mb-4`}>
        <Icon size={24} className="text-white" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted mb-4">{subtitle}</p>

      <p className="text-sm text-foreground/80 mb-4 leading-relaxed">{description}</p>

      <ul className="space-y-1.5 mb-6 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-muted">
            <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>

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

interface LearningPath {
  greeting?: string
  focus_summary?: string
  videos?: Array<{ id: string; title: string; why: string }>
  agents?: Array<{ id: string; why: string }>
  milestones?: { '30'?: string[]; '60'?: string[]; '90'?: string[] }
}

function LearningPathWidget() {
  const [path, setPath] = useState<LearningPath | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasPath, setHasPath] = useState(false)
  const [completed, setCompleted] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data: profile } = await supabase
          .from('profiles')
          .select('learning_path, learning_path_generated_at')
          .eq('id', user.id)
          .single()

        if (profile?.learning_path) {
          const lp = profile.learning_path as LearningPath
          if (lp.videos && lp.videos.length > 0) {
            setPath(lp)
            setHasPath(true)
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('herr_tech_path_progress')
      if (stored) setCompleted(parseInt(stored, 10))
    } catch {}
  }, [])

  if (loading) {
    return (
      <div className="card-static p-6 animate-pulse">
        <div className="h-4 bg-surface-secondary rounded w-48 mb-3" />
        <div className="h-2 bg-surface-secondary rounded w-full" />
      </div>
    )
  }

  if (!hasPath) {
    return (
      <div className="card-static p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles size={20} className="text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Dein persönlicher Lernpfad</h3>
          <p className="text-sm text-muted">Starte das Onboarding und erhalte personalisierte Empfehlungen.</p>
        </div>
        <Link href="/dashboard/onboarding" className="btn-primary shrink-0">
          Onboarding beginnen
        </Link>
      </div>
    )
  }

  const totalVideos = path?.videos?.length ?? 0
  const progress = totalVideos > 0 ? Math.round((completed / totalVideos) * 100) : 0
  const nextVideo = path?.videos?.[completed] ?? path?.videos?.[0]

  const ringSize = 56
  const strokeWidth = 4
  const radius = (ringSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <Link href="/dashboard/path" className="group block">
      <div className="card-static overflow-hidden hover:border-primary/30 transition-all">
        <div className="flex flex-col sm:flex-row">
          <div className="flex items-center gap-5 p-5 sm:p-6 flex-1 min-w-0">
            <div className="relative shrink-0">
              <svg width={ringSize} height={ringSize} className="-rotate-90">
                <circle
                  cx={ringSize / 2} cy={ringSize / 2} r={radius}
                  fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth}
                />
                <circle
                  cx={ringSize / 2} cy={ringSize / 2} r={radius}
                  fill="none" stroke="var(--color-primary)" strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">{progress}%</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-foreground">Dein Lernpfad</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {completed}/{totalVideos} Videos
                </span>
              </div>
              {path?.focus_summary && (
                <p className="text-xs text-muted mb-2 line-clamp-1">{path.focus_summary}</p>
              )}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalVideos }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i < completed ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {nextVideo && (
            <div className="flex items-center gap-3 px-5 sm:px-6 pb-5 sm:pb-0 sm:border-l border-border sm:min-w-[260px]">
              <div className="w-9 h-9 rounded-[var(--radius-lg)] bg-primary/10 flex items-center justify-center shrink-0">
                <Play size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-0.5">
                  {completed > 0 ? 'Weiter mit' : 'Starte mit'}
                </p>
                <p className="text-sm font-medium text-foreground truncate">{nextVideo.title}</p>
              </div>
              <ArrowRight size={16} className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// ═══════════════════════════════════════════════════════════
// KI MARKETING CLUB UPSELL
// ═══════════════════════════════════════════════════════════

function MarketingClubCompact({ upsell }: { upsell: UpsellCopy }) {
  return (
    <Link
      href={upsell.cta_url ?? 'https://www.skool.com/herr-tech'}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
    >
      <Users size={14} />
      Zur Community
    </Link>
  )
}

function MarketingClubFull({ upsell }: { upsell: UpsellCopy }) {
  const ButtonTag: 'a' | 'button' = upsell.cta_coming_soon || !upsell.cta_url ? 'button' : 'a'
  const disabled = upsell.cta_coming_soon || !upsell.cta_url

  return (
    <div className="card-static p-6 sm:p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              KI Marketing Club
            </span>
            {upsell.cta_coming_soon && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                <Clock size={10} /> Coming Soon
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1.5">
            {upsell.heading}
          </h3>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            {upsell.intro}
          </p>
          {upsell.benefits.length > 0 && (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
              {upsell.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-xs text-foreground">
                  <Check size={14} className="text-primary shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-2 lg:min-w-[220px]">
          {ButtonTag === 'a' ? (
            <a
              href={upsell.cta_url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl text-sm transition-colors whitespace-nowrap"
            >
              {upsell.cta_label}
            </a>
          ) : (
            <button
              disabled={disabled}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary/40 text-white font-semibold rounded-xl text-sm cursor-not-allowed whitespace-nowrap"
            >
              {upsell.cta_label}
            </button>
          )}
          {upsell.cta_coming_soon && (
            <span className="text-[11px] text-muted text-center leading-tight">
              Anmeldung startet bald — wir informieren dich rechtzeitig.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════

function stateToLock(state: FeatureState, isAdmin: boolean): string | undefined {
  if (isAdmin) return undefined
  if (state === 'open') return undefined
  if (state === 'coming_soon') return 'Coming Soon'
  if (state === 'community') return 'KI Marketing Club'
  if (state === 'paid') return 'Kostenpflichtig'
  return undefined
}

export default function DashboardView({
  tier,
  isAdmin,
  states,
  upsell,
}: {
  tier: AccessTier
  isAdmin: boolean
  states: Record<FeatureKey, FeatureState>
  upsell: UpsellCopy
}) {
  const classroomLock = stateToLock(states.classroom, isAdmin)
  const chatLock = stateToLock(states.chat, isAdmin)
  const toolboxLock = stateToLock(states.toolbox, isAdmin)

  // Premium/Community → kompakter Link oben; sonst → prominenter Upsell-Block
  const showFullUpsell = !isAdmin && tier !== 'premium'
  const showCompactCommunity = isAdmin || tier === 'premium'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
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
        {showCompactCommunity && <MarketingClubCompact upsell={upsell} />}
      </div>

      {/* Learning Path Widget */}
      <div className="mb-8">
        <LearningPathWidget />
      </div>

      {/* Community Upsell — für basic + alumni */}
      {showFullUpsell && <MarketingClubFull upsell={upsell} />}

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
          lockLabel={classroomLock}
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
          lockLabel={chatLock}
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
          lockLabel={toolboxLock}
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
