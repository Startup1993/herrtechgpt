'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { TemplateDefinition } from '@/lib/email-templates/registry'

interface Props {
  def: TemplateDefinition
  initialSubject: string | null
  initialData: Record<string, string> | null
  hasOverride: boolean
}

export default function EmailEditForm({ def, initialSubject, initialData, hasOverride }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Felder werden mit Defaults initialisiert, falls nichts in der DB liegt.
  // So sieht der Admin sofort die aktuellen Texte und kann sie direkt anpassen.
  const initial: Record<string, string> = {}
  for (const f of def.fields) {
    if (f.key === 'subject') {
      initial.subject = initialSubject ?? def.defaults.subject
    } else {
      initial[f.key] = initialData?.[f.key] ?? def.defaults.data[f.key] ?? ''
    }
  }

  const [values, setValues] = useState<Record<string, string>>(initial)
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [previewSubject, setPreviewSubject] = useState<string>('')
  const [previewLoading, setPreviewLoading] = useState(false)

  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchPreview = useCallback(async (vals: Record<string, string>) => {
    setPreviewLoading(true)
    try {
      const { subject, ...data } = vals
      const res = await fetch('/api/admin/emails/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: def.key, subject, data }),
      })
      if (res.ok) {
        const json = await res.json()
        setPreviewHtml(json.html)
        setPreviewSubject(json.subject)
      }
    } finally {
      setPreviewLoading(false)
    }
  }, [def.key])

  // Live-Preview mit 400ms Debounce.
  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current)
    previewTimer.current = setTimeout(() => fetchPreview(values), 400)
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current)
    }
  }, [values, fetchPreview])

  function setField(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    const { subject, ...data } = values
    const res = await fetch('/api/admin/emails', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: def.key, subject, data }),
    })
    setSaving(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error ?? 'Fehler beim Speichern')
      return
    }
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleReset() {
    if (!confirm('Wirklich auf den Standard-Text zurücksetzen? Deine Änderungen gehen verloren.')) return
    setResetting(true)
    setError(null)
    const res = await fetch(`/api/admin/emails?key=${def.key}`, { method: 'DELETE' })
    setResetting(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error ?? 'Fehler beim Zurücksetzen')
      return
    }
    const reset: Record<string, string> = { subject: def.defaults.subject }
    for (const f of def.fields) {
      if (f.key !== 'subject') reset[f.key] = def.defaults.data[f.key] ?? ''
    }
    setValues(reset)
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ─── Form ────────────────────────────────────────── */}
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Variablen-Übersicht */}
        {def.variables.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">
              Verfügbare Variablen
            </div>
            <ul className="space-y-1.5">
              {def.variables.map((v) => (
                <li key={v.key} className="text-sm flex items-start gap-2">
                  <code className="text-xs bg-surface-secondary px-1.5 py-0.5 rounded text-primary shrink-0">
                    {v.key}
                  </code>
                  <span className="text-muted">{v.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Felder */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          {def.fields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs text-muted mb-1.5 font-medium">
                {field.label}
              </label>
              {field.kind === 'textarea' || field.kind === 'rich' ? (
                <textarea
                  value={values[field.key] ?? ''}
                  onChange={(e) => setField(field.key, e.target.value)}
                  rows={field.kind === 'rich' ? 6 : 3}
                  className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                />
              ) : (
                <input
                  type="text"
                  value={values[field.key] ?? ''}
                  onChange={(e) => setField(field.key, e.target.value)}
                  className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
              {field.hint && <p className="text-xs text-muted mt-1">{field.hint}</p>}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 sticky bottom-0 bg-background py-3 -mx-1 px-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
          {hasOverride && (
            <button
              onClick={handleReset}
              disabled={resetting}
              className="px-5 py-2.5 border border-border text-sm text-muted hover:text-foreground hover:bg-surface-secondary rounded-lg transition-colors disabled:opacity-50"
            >
              {resetting ? 'Zurücksetzen...' : 'Auf Standard zurücksetzen'}
            </button>
          )}
          {saved && <span className="text-sm text-green-600">Gespeichert</span>}
        </div>
      </div>

      {/* ─── Live-Preview ──────────────────────────────────── */}
      <div className="space-y-3 lg:sticky lg:top-6 self-start">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider text-muted font-semibold">
            Live-Vorschau {previewLoading && <span className="text-muted ml-2">(lädt…)</span>}
          </h2>
        </div>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-secondary">
            <div className="text-xs text-muted">Betreff</div>
            <div className="text-sm font-medium text-foreground mt-0.5 break-words">
              {previewSubject || '—'}
            </div>
          </div>
          <iframe
            title="email-preview"
            srcDoc={previewHtml}
            sandbox=""
            className="w-full bg-white"
            style={{ height: '700px', border: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
