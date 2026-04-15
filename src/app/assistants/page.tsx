import { agents } from '@/lib/agents'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AssistantsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profileComplete = false
  let hasLearningPath = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('background, market, learning_path')
      .eq('id', user.id)
      .single()
    profileComplete = !!(profile?.background || profile?.market)
    const lp = profile?.learning_path as { videos?: unknown[] } | null
    hasLearningPath = !!(lp?.videos && Array.isArray(lp.videos) && lp.videos.length > 0)
  }

  const recommended = agents.find((a) => a.isRecommended)
  const others = agents.filter((a) => !a.isRecommended)

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background">
      <div className="max-w-2xl mx-auto w-full px-6 py-8">

        {/* Learning path CTA (shown when path exists) */}
        {hasLearningPath && (
          <Link
            href="/assistants/path"
            className="flex items-center gap-4 p-4 mb-6 rounded-xl bg-primary/8 border border-primary/20 hover:bg-primary/12 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-lg">
              🎯
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Dein Lernpfad ist bereit
              </p>
              <p className="text-xs text-muted mt-0.5">
                Die wichtigsten Videos für dich + 30/60/90-Tage-Plan.
              </p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0 group-hover:translate-x-0.5 transition-transform">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        )}

        {/* Profile completion banner */}
        {!profileComplete && (
          <Link
            href="/assistants/onboarding"
            className="flex items-center gap-4 p-4 mb-8 rounded-xl bg-primary/8 border border-primary/20 hover:bg-primary/12 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-lg">
              🧠
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Wissensbasis einrichten — 2 Minuten
              </p>
              <p className="text-xs text-muted mt-0.5">
                Damit die KI weiß, wer du bist und deine Antworten 10x relevanter werden.
              </p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0 group-hover:translate-x-0.5 transition-transform">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Deine Assistenten</h1>
          <p className="text-sm text-muted">Jeder Assistent ist auf eine Aufgabe spezialisiert.</p>
        </div>

        {/* Recommended Agent */}
        {recommended && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">⭐ Empfohlen zum Start</span>
            </div>
            <Link
              href={`/assistants/${recommended.id}`}
              className="group flex gap-4 p-5 rounded-2xl border border-primary/25 bg-primary/5 hover:bg-primary/8 hover:border-primary/40 transition-all shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-2xl shrink-0">
                {recommended.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1">{recommended.name}</h3>
                <p className="text-sm text-muted mb-3">{recommended.description}</p>
                {recommended.bestFor && recommended.bestFor.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {recommended.bestFor.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        )}

        {/* All Agents Grid */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Alle Assistenten</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {others.map((agent) => (
              <Link
                key={agent.id}
                href={`/assistants/${agent.id}`}
                className="group flex gap-3 p-4 rounded-xl border border-border bg-surface hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center text-xl shrink-0">
                  {agent.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground mb-0.5 truncate">{agent.name}</h3>
                  <p className="text-xs text-muted leading-snug mb-2 line-clamp-2">{agent.description}</p>
                  {agent.bestFor && agent.bestFor.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {agent.bestFor.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-1.5 py-0.5 rounded bg-surface-secondary text-muted font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
