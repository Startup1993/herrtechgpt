import Link from 'next/link'
import { cookies } from 'next/headers'
import { ArrowRight, Clock, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolveToolboxIcon, type ToolboxTool } from '@/lib/toolbox-icons'
import { computeEffectiveAccess, VIEW_AS_COOKIE } from '@/lib/access'
import { getProfileCached } from '@/lib/server-cache'

export const dynamic = 'force-dynamic'

export default async function KiToolboxPage() {
  const supabase = await createClient()
  const [{ data }, profile, cookieStore] = await Promise.all([
    supabase
      .from('toolbox_tools')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true }),
    getProfileCached(),
    cookies(),
  ])

  const access = computeEffectiveAccess(profile, cookieStore.get(VIEW_AS_COOKIE)?.value)
  // Echte Admins (nicht im Testmodus) bekommen "Coming Soon"-Tools trotzdem
  // klickbar, damit sie sie selbst testen können. Badge bleibt sichtbar als
  // Hinweis "für normale User Coming Soon".
  const bypassComingSoon = access.isAdmin

  const tools = (data ?? []) as ToolboxTool[]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
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
          const Icon = resolveToolboxIcon(tool.icon_name)
          const disabled = (tool.coming_soon && !bypassComingSoon) || !tool.href

          const cardInner = (
            <>
              {tool.coming_soon && (
                <div className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                  <Clock size={10} /> Coming Soon
                </div>
              )}
              <div
                className={`w-12 h-12 rounded-[var(--radius-xl)] ${tool.icon_bg} flex items-center justify-center mb-4`}
              >
                <Icon size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {tool.title}
              </h3>
              {tool.subtitle && (
                <p className="text-xs text-muted mb-3">{tool.subtitle}</p>
              )}
              <p className="text-sm text-foreground/80 leading-relaxed flex-1 mb-4">
                {tool.description}
              </p>
              <div
                className={`flex items-center gap-2 text-sm font-medium ${
                  disabled ? 'text-muted' : 'text-primary'
                }`}
              >
                {disabled ? 'Noch nicht verfügbar' : 'Jetzt öffnen'}
                <ArrowRight size={14} />
              </div>
            </>
          )

          if (disabled) {
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
              href={tool.href!}
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
