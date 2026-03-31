'use client'

import { useState } from 'react'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  agentId?: string
  agentName?: string
}

export function ChatMessage({ role, content, agentId, agentName }: ChatMessageProps) {
  const isUser = role === 'user'
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (saved || saving) return
    setSaving(true)
    try {
      await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, agentId, agentName }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className="relative max-w-[80%]">
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-primary text-white rounded-br-md'
              : 'bg-surface-secondary text-foreground rounded-bl-md border border-border'
          }`}
        >
          {content}
        </div>

        {/* Save button — only on assistant messages */}
        {!isUser && (
          <button
            onClick={handleSave}
            disabled={saving}
            title={saved ? 'Gespeichert!' : 'In Bibliothek speichern'}
            className={`absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-full border shadow-sm text-xs ${
              saved
                ? 'bg-green-50 border-green-200 text-green-600 opacity-100'
                : 'bg-surface border-border text-muted hover:text-primary hover:border-primary/30'
            }`}
          >
            {saved ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
