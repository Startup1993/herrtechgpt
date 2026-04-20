'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AgentDefinition } from '@/lib/agents'
import type { AgentConfig } from '@/lib/types'

interface Props {
  agent: AgentDefinition
  config: AgentConfig | null
}

export default function AgentEditForm({ agent, config }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(config?.name ?? agent.name)
  const [description, setDescription] = useState(config?.description ?? agent.description)
  const [emoji, setEmoji] = useState(config?.emoji ?? agent.emoji)
  const [systemPrompt, setSystemPrompt] = useState(config?.system_prompt ?? agent.systemPrompt)
  const [isActive, setIsActive] = useState(config?.is_active ?? true)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)

    const res = await fetch('/api/admin/agents', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agent.id,
        name,
        description,
        emoji,
        system_prompt: systemPrompt,
        is_active: isActive,
      }),
    })

    setSaving(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Fehler beim Speichern')
      return
    }

    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleReset() {
    if (!config) return
    setResetting(true)
    setError(null)

    const res = await fetch(`/api/admin/agents?agent_id=${agent.id}`, { method: 'DELETE' })

    setResetting(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Fehler beim Zurücksetzen')
      return
    }

    setName(agent.name)
    setDescription(agent.description)
    setEmoji(agent.emoji)
    setSystemPrompt(agent.systemPrompt)
    setIsActive(true)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* Basic Info */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Grundeinstellungen</h2>

        <div className="grid grid-cols-[80px_1fr] gap-4 items-start">
          <div>
            <label className="block text-xs text-muted mb-1.5">Emoji</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-full text-center text-2xl bg-surface-secondary border border-border rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              maxLength={2}
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1.5">Kurzbeschreibung</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive(!isActive)}
            className={`relative w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-border'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className="text-sm text-foreground">{isActive ? 'Aktiv' : 'Deaktiviert'}</span>
        </div>
      </div>

      {/* System Prompt */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-3">
        <div>
          <h2 className="font-semibold text-foreground">System-Prompt</h2>
          <p className="text-xs text-muted mt-0.5">Definiert das Verhalten und die Persönlichkeit des Assistenten.</p>
        </div>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={20}
          className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {saving ? 'Speichern...' : 'Speichern'}
        </button>

        {config && (
          <button
            onClick={handleReset}
            disabled={resetting}
            className="px-5 py-2.5 border border-border text-sm text-muted hover:text-foreground hover:bg-surface-secondary rounded-lg transition-colors disabled:opacity-50"
          >
            {resetting ? 'Zurücksetzen...' : 'Auf Standard zurücksetzen'}
          </button>
        )}

        {saved && (
          <span className="text-sm text-green-600">Gespeichert</span>
        )}
      </div>
    </div>
  )
}
