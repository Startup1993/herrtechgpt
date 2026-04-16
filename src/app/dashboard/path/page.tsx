import { createClient } from '@/lib/supabase/server'
import { agents as allAgents } from '@/lib/agents'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface LearningPath {
  greeting?: string
  focus_summary?: string
  videos?: Array<{ id: string; title: string; why: string }>
  agents?: Array<{ id: string; why: string }>
  milestones?: { '30'?: string[]; '60'?: string[]; '90'?: string[] }
}

export default async function DashboardPathPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('learning_path, learning_path_generated_at, access_tier')
    .eq('id', user.id)
    .single()

  const path = (profile?.learning_path as LearningPath) ?? {}
  const hasPath = path.videos && path.videos.length > 0
  const isPremium = profile?.access_tier === 'premium'

  if (!hasPath) {
    return (
      <div className="max-w-2xl mx-auto w-full px-6 py-12 text-center">
        <div className="text-5xl mb-5">🎯</div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Noch kein Lernpfad</h1>
        <p className="text-sm text-muted mb-6">
          Mach das Onboarding-Quiz und erhalte in 15 Sekunden einen individuellen
          Lernpfad mit den wichtigsten Videos und einem 30/60/90-Tage-Plan.
        </p>
        <Link
          href="/assistants/onboarding"
          className="inline-block px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Quiz starten →
        </Link>
      </div>
    )
  }

  const recommendedAgents = (path.agents ?? []).map((a) => {
    const full = allAgents.find((x) => x.id === a.id)
    return { ...a, agent: full }
  }).filter((a) => a.agent)

  const generatedDate = profile?.learning_path_generated_at
    ? new Date(profile.learning_path_generated_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="max-w-3xl mx-auto w-full px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🎯</span>
          <h1 className="text-2xl font-bold text-foreground">Dein Lernpfad</h1>
        </div>
        {path.greeting && (
          <p className="text-sm text-foreground leading-relaxed">{path.greeting}</p>
        )}
        {path.focus_summary && (
          <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Dein Fokus</p>
            <p className="text-sm text-foreground font-medium">{path.focus_summary}</p>
          </div>
        )}
      </div>

      {/* Videos */}
      {path.videos && path.videos.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            🎬 Deine nächsten {path.videos.length} Videos
          </h2>
          <div className="space-y-2">
            {path.videos.map((v, i) => (
              <div key={v.id} className="flex gap-4 p-4 rounded-xl border border-border bg-surface">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground mb-1">{v.title}</p>
                  <p className="text-xs text-muted leading-relaxed">{v.why}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Agents — nur für premium sichtbar */}
      {recommendedAgents.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            🤖 Empfohlene Assistenten
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendedAgents.map(({ agent, why }) => (
              <div
                key={agent!.id}
                className={`flex gap-3 p-4 rounded-xl border bg-surface ${
                  isPremium ? 'border-border hover:border-primary/40 hover:shadow-sm cursor-pointer' : 'border-border/50 opacity-70'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center text-xl shrink-0">
                  {agent!.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground">{agent!.name}</p>
                    {!isPremium && <span className="text-xs text-muted">🔒</span>}
                  </div>
                  <p className="text-xs text-muted leading-snug">{why}</p>
                </div>
              </div>
            ))}
          </div>
          {!isPremium && (
            <p className="text-xs text-muted mt-2">
              Assistenten sind nur für aktive Community-Mitglieder verfügbar.{' '}
              <Link href="/dashboard/upgrade" className="text-primary hover:underline">
                Mehr erfahren →
              </Link>
            </p>
          )}
        </section>
      )}

      {/* Milestones */}
      {path.milestones && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            📅 Dein 30/60/90-Tage-Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {([30, 60, 90] as const).map((days) => {
              const items = path.milestones?.[String(days) as '30' | '60' | '90'] ?? []
              if (items.length === 0) return null
              return (
                <div key={days} className="p-4 rounded-xl border border-border bg-surface">
                  <p className="text-xs font-bold text-primary mb-3">{days} Tage</p>
                  <ul className="space-y-2">
                    {items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-xs text-foreground">
                        <span className="text-primary shrink-0">•</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-border text-xs text-muted">
        {generatedDate && <p>Erstellt am {generatedDate}</p>}
        <Link href="/assistants/onboarding" className="text-primary hover:underline">
          Pfad neu erstellen
        </Link>
      </div>
    </div>
  )
}
