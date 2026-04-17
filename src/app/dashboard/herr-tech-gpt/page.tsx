'use client'

import Link from 'next/link'
import { agents } from '@/lib/agents'
import { ArrowRight } from 'lucide-react'

export default function HerrTechGptPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Herr Tech GPT
        </h1>
        <p className="text-muted text-sm sm:text-base">
          Wähle einen KI-Agenten und starte deinen Chat. Jeder Agent ist auf einen Bereich spezialisiert.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Link
            key={agent.id}
            href={`/dashboard/herr-tech-gpt?agent=${agent.id}`}
            className="card group flex flex-col p-5"
          >
            <span className="text-3xl mb-3">{agent.emoji}</span>
            <h3 className="text-base font-semibold text-foreground mb-1">{agent.name}</h3>
            <p className="text-sm text-muted mb-4 flex-1 line-clamp-2">{agent.description}</p>
            <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
              Chat starten
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
