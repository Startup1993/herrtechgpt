import { agents } from '@/lib/agents'
import Link from 'next/link'

export default function AssistantsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-background">
      <div className="max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Willkommen bei <span className="font-black uppercase">Herr Tech<span className="text-primary">.</span></span>
        </h1>
        <p className="text-muted mb-8">
          Wähle einen Assistenten aus, um loszulegen.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/assistants/${agent.id}`}
              className="flex items-start gap-4 p-4 rounded-xl border border-border bg-surface hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <span className="text-xl mt-0.5 shrink-0">{agent.emoji}</span>
              <div>
                <h3 className="font-medium text-foreground">{agent.name}</h3>
                <p className="text-sm text-muted mt-1">
                  {agent.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
