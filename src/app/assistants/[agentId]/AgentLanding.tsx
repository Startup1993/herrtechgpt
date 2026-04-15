'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { AgentDefinition } from '@/lib/agents'
import { VoiceRecordingUI } from '@/components/voice-recording-ui'
import { useVoiceDictation } from '@/hooks/use-voice-dictation'
import { CurrentToolsWidget } from '@/components/current-tools-widget'

export default function AgentLanding({ agent }: { agent: AgentDefinition }) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { isListening, analyserRef, toggleDictation, cancelDictation, confirmDictation } =
    useVoiceDictation({
      onTranscript: (text) => setInput((prev) => prev + text),
    })

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim()
    if (!messageText || loading) return

    setLoading(true)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id }),
      })
      const { id } = await res.json()
      router.push(`/assistants/${agent.id}/${id}?init=${encodeURIComponent(messageText)}`)
    } catch {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">
        <div className="text-5xl mb-4">{agent.emoji}</div>
        <h2 className="text-xl font-semibold text-foreground mb-2">{agent.name}</h2>
        <p className="text-sm text-muted max-w-md text-center mb-4">{agent.description}</p>
        <CurrentToolsWidget agentId={agent.id} />
      </div>

      {/* Chat input — always visible at the bottom */}
      <div className="border-t border-border bg-surface p-4">
        {isListening ? (
          <VoiceRecordingUI
            analyserRef={analyserRef}
            onCancel={cancelDictation}
            onConfirm={confirmDictation}
          />
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 items-end bg-background border border-border rounded-2xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-shadow">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={agent.placeholder}
                rows={1}
                disabled={loading}
                className="flex-1 py-2 text-sm resize-none max-h-32 overflow-y-auto bg-transparent focus:outline-none placeholder:text-muted/60 disabled:opacity-60"
                style={{ minHeight: '36px' }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement
                  t.style.height = 'auto'
                  t.style.height = Math.min(t.scrollHeight, 128) + 'px'
                }}
              />
              <div className="flex items-center gap-1 pb-1">
                {/* Dictation button */}
                <button
                  onClick={toggleDictation}
                  type="button"
                  disabled={loading}
                  className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-secondary transition-colors disabled:opacity-40"
                  title="Spracheingabe"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>
                {/* Send button */}
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="p-2 bg-primary hover:bg-primary-hover disabled:bg-border disabled:text-white/50 text-white rounded-lg transition-colors"
                >
                  {loading ? (
                    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
