'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Plus, X, Check, AlertCircle } from 'lucide-react'
import {
  FEATURES,
  STATES,
  TIERS,
  FEATURE_LABELS,
  STATE_META,
  TIER_META,
  type FeatureKey,
  type FeatureState,
  type PermissionMatrix,
  type UpsellCopy,
} from '@/lib/permissions'
import type { AccessTier } from '@/lib/access'

type Tab = 'matrix' | 'upsell'

export function GroupsEditor({
  initialMatrix,
  initialUpsell,
  subscriptionsEnabled,
}: {
  initialMatrix: PermissionMatrix
  initialUpsell: Record<AccessTier, UpsellCopy>
  subscriptionsEnabled: boolean
}) {
  const [tab, setTab] = useState<Tab>('matrix')

  return (
    <div>
      <div className="flex gap-1 border-b border-border mb-6">
        <TabButton active={tab === 'matrix'} onClick={() => setTab('matrix')}>
          Berechtigungsmatrix
        </TabButton>
        <TabButton active={tab === 'upsell'} onClick={() => setTab('upsell')}>
          Upsell-Texte
        </TabButton>
      </div>

      {tab === 'matrix' && (
        <MatrixEditor
          initial={initialMatrix}
          subscriptionsEnabled={subscriptionsEnabled}
        />
      )}
      {tab === 'upsell' && <UpsellEditor initial={initialUpsell} />}
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
        active
          ? 'text-primary border-primary'
          : 'text-muted border-transparent hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════
// MATRIX EDITOR
// ═══════════════════════════════════════════════════════════

function MatrixEditor({
  initial,
  subscriptionsEnabled,
}: {
  initial: PermissionMatrix
  subscriptionsEnabled: boolean
}) {
  const router = useRouter()
  const [matrix, setMatrix] = useState<PermissionMatrix>(initial)
  const [saving, setSaving] = useState<string | null>(null)
  const [recentSaved, setRecentSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // In NoSubs-Welt blenden wir 'paid' (= "Abo-Zugriff") aus dem Dropdown +
  // der Legende aus. Der State existiert technisch noch, aber Admin soll
  // ihn nicht setzen können solange Abos deaktiviert sind.
  const availableStates: FeatureState[] = subscriptionsEnabled
    ? [...STATES]
    : STATES.filter((s) => s !== 'paid')

  const update = async (tier: AccessTier, feature: FeatureKey, state: FeatureState) => {
    const key = `${tier}_${feature}`
    setSaving(key)
    setError(null)
    const res = await fetch('/api/admin/permissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'matrix', tier, feature, state }),
    })
    setSaving(null)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Fehler beim Speichern')
      return
    }
    setMatrix((m) => ({
      ...m,
      [tier]: { ...m[tier], [feature]: state },
    }))
    setRecentSaved(key)
    setTimeout(() => setRecentSaved(null), 1500)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Matrix umstrukturiert (W11): Tiers als Spalten (3 fixe Gruppen),
          Features als Zeilen (erweiterbar — Lernpfad neu, weitere folgen).
          horizontal scrollbar für schmale Viewports. */}
      <div className="card-static overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider sticky left-0 bg-surface-secondary">
                  Bereich
                </th>
                {TIERS.map((tier) => {
                  const meta = TIER_META[tier]
                  return (
                    <th
                      key={tier}
                      className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${meta.dot}`} />
                        <div>
                          <div className="text-foreground normal-case">{meta.label}</div>
                          <div className="text-[10px] text-muted normal-case font-normal">{meta.hint}</div>
                        </div>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {FEATURES.map((feature) => {
                const featureMeta = FEATURE_LABELS[feature]
                return (
                  <tr key={feature}>
                    <td className="px-5 py-4 sticky left-0 bg-surface">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base shrink-0">{featureMeta.emoji}</span>
                        <div className="font-semibold text-foreground text-sm">
                          {featureMeta.label}
                        </div>
                      </div>
                    </td>
                    {TIERS.map((tier) => {
                      const key = `${tier}_${feature}`
                      const value = matrix[tier][feature]
                      const meta = STATE_META[value]
                      return (
                        <td key={tier} className="px-4 py-4 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <select
                              value={value}
                              onChange={(e) => update(tier, feature, e.target.value as FeatureState)}
                              disabled={saving !== null}
                              className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${meta.badge} disabled:opacity-50`}
                            >
                              {availableStates.map((s) => (
                                <option key={s} value={s} className="bg-surface text-foreground">
                                  {STATE_META[s].label}
                                </option>
                              ))}
                            </select>
                            {saving === key && <Loader2 size={14} className="animate-spin text-muted shrink-0" />}
                            {recentSaved === key && <Check size={14} className="text-green-600 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-muted mt-1 leading-tight">{meta.hint}</p>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="card-static p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Status-Legende</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableStates.map((s) => (
            <div key={s} className="flex items-start gap-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${STATE_META[s].badge}`}>
                {STATE_META[s].label}
              </span>
              <span className="text-xs text-muted leading-relaxed">{STATE_META[s].hint}</span>
            </div>
          ))}
        </div>
        {!subscriptionsEnabled && (
          <p className="text-xs text-muted mt-3 leading-relaxed">
            <strong>Hinweis:</strong> Der Status &bdquo;Abo-Zugriff&ldquo; ist
            ausgeblendet, weil das Abo-System in &bdquo;Modus &amp; Defaults&ldquo;
            deaktiviert ist. Solche Legacy-Werte aus der Datenbank werden bei
            der Anzeige ignoriert.
          </p>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// UPSELL EDITOR
// ═══════════════════════════════════════════════════════════

function UpsellEditor({ initial }: { initial: Record<AccessTier, UpsellCopy> }) {
  const router = useRouter()
  const [copies, setCopies] = useState<Record<AccessTier, UpsellCopy>>(initial)
  const [saving, setSaving] = useState<AccessTier | null>(null)
  const [saved, setSaved] = useState<AccessTier | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isDirty = (tier: AccessTier): boolean => {
    const a = copies[tier]
    const b = initial[tier]
    return a.heading !== b.heading
      || a.intro !== b.intro
      || a.benefits.join('|') !== b.benefits.join('|')
      || a.cta_label !== b.cta_label
      || a.cta_coming_soon !== b.cta_coming_soon
      || a.cta_url !== b.cta_url
  }

  const update = <K extends keyof UpsellCopy>(tier: AccessTier, field: K, value: UpsellCopy[K]) => {
    setCopies((c) => ({ ...c, [tier]: { ...c[tier], [field]: value } }))
  }

  const save = async (tier: AccessTier) => {
    setSaving(tier)
    setError(null)
    const copy = copies[tier]
    const res = await fetch('/api/admin/permissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'upsell',
        tier,
        heading: copy.heading,
        intro: copy.intro,
        benefits: copy.benefits,
        cta_label: copy.cta_label,
        cta_coming_soon: copy.cta_coming_soon,
        cta_url: copy.cta_url,
      }),
    })
    setSaving(null)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Fehler beim Speichern')
      return
    }
    setSaved(tier)
    setTimeout(() => setSaved(null), 2000)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="card-static p-4 bg-primary/5 border-primary/20">
        <p className="text-xs text-muted leading-relaxed">
          <strong className="text-foreground">Upsell-Texte</strong> werden angezeigt, wenn ein User eine Funktion aufruft, die für seine Gruppe gesperrt ist (State <code className="px-1 py-0.5 rounded bg-surface text-foreground">Community-only</code>) — außerdem als Block auf dem Dashboard für Basic- und Alumni-User.
        </p>
      </div>

      {TIERS.map((tier) => {
        const copy = copies[tier]
        const tierMeta = TIER_META[tier]
        const dirty = isDirty(tier)
        return (
          <div key={tier} className="card-static p-5">
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${tierMeta.dot}`} />
              <div className="flex-1">
                <h2 className="text-base font-bold text-foreground">{tierMeta.label}</h2>
                <p className="text-xs text-muted">{tierMeta.hint}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Field label="Überschrift">
                <input
                  type="text"
                  value={copy.heading}
                  onChange={(e) => update(tier, 'heading', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </Field>
              <Field label="Intro-Text">
                <textarea
                  value={copy.intro}
                  onChange={(e) => update(tier, 'intro', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                />
              </Field>
              <Field label="Vorteile (eine pro Zeile)">
                <BenefitsEditor value={copy.benefits} onChange={(v) => update(tier, 'benefits', v)} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="CTA-Button-Text">
                  <input
                    type="text"
                    value={copy.cta_label}
                    onChange={(e) => update(tier, 'cta_label', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </Field>
                <Field label="CTA-Ziel-URL">
                  <input
                    type="text"
                    value={copy.cta_url ?? ''}
                    onChange={(e) => update(tier, 'cta_url', e.target.value || null)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copy.cta_coming_soon}
                  onChange={(e) => update(tier, 'cta_coming_soon', e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm text-foreground">"Coming Soon" Label neben CTA anzeigen (Button deaktiviert)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-border">
              <span className="text-xs text-muted">
                {dirty ? 'Ungespeicherte Änderungen' : saved === tier ? '✓ Gespeichert' : 'Aktuell'}
              </span>
              <button
                onClick={() => save(tier)}
                disabled={saving !== null || !dirty}
                className="btn-primary disabled:opacity-40"
              >
                {saving === tier ? <><Loader2 size={14} className="animate-spin" /> Speichere…</> :
                 <><Save size={14} /> Speichern</>}
              </button>
            </div>
          </div>
        )
      })}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function BenefitsEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const t = draft.trim()
    if (!t) return
    onChange([...value, t])
    setDraft('')
  }

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx))

  const updateAt = (idx: number, v: string) => {
    const next = [...value]
    next[idx] = v
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {value.map((b, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Check size={14} className="text-primary shrink-0" />
          <input
            type="text"
            value={b}
            onChange={(e) => updateAt(idx, e.target.value)}
            className="flex-1 px-3 py-1.5 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={() => remove(idx)}
            className="p-1.5 text-muted hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            aria-label="Entfernen"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Plus size={14} className="text-muted shrink-0" />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Neuen Vorteil hinzufügen…"
          className="flex-1 px-3 py-1.5 border border-border border-dashed rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="text-xs text-primary hover:text-primary-hover font-medium px-2 disabled:opacity-40"
        >
          + Hinzufügen
        </button>
      </div>
    </div>
  )
}
