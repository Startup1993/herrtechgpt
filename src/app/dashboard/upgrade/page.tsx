import Link from 'next/link'

export default function UpgradePage() {
  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
      <div className="text-5xl mb-6">🔒</div>
      <h1 className="text-2xl font-bold text-foreground mb-3">
        KI-Workspace — nur für aktive Mitglieder
      </h1>
      <p className="text-sm text-muted leading-relaxed mb-8 max-w-md mx-auto">
        Der KI-Workspace mit allen Assistenten, Workflows und Tools ist exklusiv
        für aktive Community-Mitglieder verfügbar. Mit einer aktiven Mitgliedschaft
        bekommst du Zugang zu:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 text-left max-w-md mx-auto">
        {[
          { emoji: '🎯', text: 'Content & Hook Agent' },
          { emoji: '🤖', text: 'Funnel & Monetarisierung' },
          { emoji: '🔧', text: 'KI-Prompt-Agent' },
          { emoji: '🧠', text: 'Business-Coaching' },
          { emoji: '🎠', text: 'Karussell-Generator' },
          { emoji: '💛', text: 'Personal Growth Coach' },
        ].map((item) => (
          <div
            key={item.text}
            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface"
          >
            <span className="text-lg">{item.emoji}</span>
            <span className="text-sm text-foreground font-medium">{item.text}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 items-center">
        <a
          href="https://www.skool.com/herr-tech"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Community beitreten →
        </a>
        <Link
          href="/dashboard"
          className="text-sm text-muted hover:text-foreground transition-colors py-2"
        >
          Zurück zu den Lernvideos
        </Link>
      </div>
    </div>
  )
}
