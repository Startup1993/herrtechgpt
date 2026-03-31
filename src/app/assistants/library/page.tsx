'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface SavedItem {
  id: string
  agent_id: string | null
  agent_name: string | null
  title: string
  content: string
  created_at: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function LibraryPage() {
  const [items, setItems] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/library')
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Fehler beim Laden')
        return
      }
      const data = await res.json()
      setItems(data)
    } catch {
      setError('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCopy = async (item: SavedItem) => {
    await navigator.clipboard.writeText(item.content)
    setCopied(item.id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await fetch('/api/library', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setItems((prev) => prev.filter((i) => i.id !== id))
    setDeleting(null)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background">
      <div className="max-w-2xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">📚</span>
            <h1 className="text-2xl font-bold text-foreground">Meine Bibliothek</h1>
          </div>
          <p className="text-sm text-muted ml-11">
            Gespeicherte KI-Antworten — sofort kopierbar und wiederverwendbar.
          </p>
        </div>

        {/* Setup hint */}
        {error && error.includes('does not exist') && (
          <div className="p-5 rounded-xl border border-amber-200 bg-amber-50 mb-6">
            <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Tabelle noch nicht eingerichtet</p>
            <p className="text-xs text-amber-700 mb-3">
              Führe einmalig dieses SQL in deinem Supabase SQL-Editor aus:
            </p>
            <pre className="text-xs bg-amber-100 rounded-lg p-3 overflow-x-auto text-amber-900">
{`CREATE TABLE IF NOT EXISTS public.saved_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_id TEXT, agent_name TEXT,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.saved_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own content" ON public.saved_content
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`}
            </pre>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 text-muted text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Laden...
            </div>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-foreground font-medium mb-2">Noch nichts gespeichert</p>
            <p className="text-sm text-muted mb-6">
              Klicke in jedem Chat auf das Lesezeichen-Icon um Antworten hier zu speichern.
            </p>
            <Link
              href="/assistants"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              Jetzt Assistenten nutzen →
            </Link>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted mb-4">{items.length} gespeicherte{items.length === 1 ? 'r Eintrag' : ' Einträge'}</p>
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-surface border border-border rounded-xl overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-start gap-3 p-4">
                  <button
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="text-sm font-medium text-foreground leading-snug mb-1 line-clamp-2">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2">
                      {item.agent_name && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/8 text-primary font-medium">
                          {item.agent_name}
                        </span>
                      )}
                      <span className="text-xs text-muted">{formatDate(item.created_at)}</span>
                    </div>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopy(item)}
                      title="Kopieren"
                      className="p-2 rounded-lg hover:bg-surface-secondary text-muted hover:text-foreground transition-colors"
                    >
                      {copied === item.id ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      title="Löschen"
                      className="p-2 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {expanded === item.id && (
                  <div className="border-t border-border px-4 py-4 bg-surface-secondary/40">
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed font-mono">
                      {item.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
