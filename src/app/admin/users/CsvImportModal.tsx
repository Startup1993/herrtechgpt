'use client'

import { useRef, useState } from 'react'
import { Upload, X, Check, AlertTriangle, Loader2 } from 'lucide-react'

type AccessTier = 'basic' | 'alumni' | 'premium'

const TIER_OPTIONS: Array<{ value: AccessTier; label: string; hint: string }> = [
  { value: 'basic',   label: 'Basic',              hint: 'Kein Zugriff auf Chat/Toolbox' },
  { value: 'alumni',  label: 'Alumni',             hint: 'Classroom freigeschaltet' },
  { value: 'premium', label: 'Community (Premium)',hint: 'Voller Zugriff' },
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_HEADER_KEYS = ['created_at', 'registered_at', 'registered', 'registriert', 'signup_date', 'signupdate', 'created', 'anmeldedatum', 'datum']
const EMAIL_HEADER_KEYS = ['email', 'e-mail', 'e_mail', 'emailadresse', 'mail']

export interface ImportRow {
  email: string
  created_at?: string
}

function splitCells(line: string): string[] {
  // Simple split: comma, semicolon, or tab. Handles quoted cells minimally.
  const result: string[] = []
  let cur = ''
  let inQuote = false
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; continue }
    if (!inQuote && (ch === ',' || ch === ';' || ch === '\t')) {
      result.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  result.push(cur)
  return result.map((c) => c.trim())
}

function parseDate(value: string): string | undefined {
  const v = value.trim()
  if (!v) return undefined
  // Accept ISO, DD.MM.YYYY, YYYY-MM-DD, MM/DD/YYYY
  const isoMatch = /^\d{4}-\d{2}-\d{2}/.test(v)
  if (isoMatch) {
    const d = new Date(v)
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  const deMatch = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (deMatch) {
    const d = new Date(`${deMatch[3]}-${deMatch[2].padStart(2, '0')}-${deMatch[1].padStart(2, '0')}`)
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  const d = new Date(v)
  if (!isNaN(d.getTime())) return d.toISOString()
  return undefined
}

export function parseCsv(text: string): ImportRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []

  // Detect header
  const firstCells = splitCells(lines[0]).map((c) => c.toLowerCase())
  const hasEmailHeader = firstCells.some((c) => EMAIL_HEADER_KEYS.includes(c))
  const hasFirstRowEmail = firstCells.some((c) => EMAIL_REGEX.test(c))
  const hasHeader = hasEmailHeader && !hasFirstRowEmail

  let emailIdx = -1
  let dateIdx = -1
  const startIdx = hasHeader ? 1 : 0
  if (hasHeader) {
    emailIdx = firstCells.findIndex((c) => EMAIL_HEADER_KEYS.includes(c))
    dateIdx = firstCells.findIndex((c) => DATE_HEADER_KEYS.includes(c))
  }

  const seen = new Set<string>()
  const rows: ImportRow[] = []
  for (let i = startIdx; i < lines.length; i++) {
    const cells = splitCells(lines[i])
    let email = ''
    if (emailIdx >= 0 && cells[emailIdx]) {
      email = cells[emailIdx].toLowerCase()
    } else {
      // Fallback: erste Zelle, die wie E-Mail aussieht
      const found = cells.find((c) => EMAIL_REGEX.test(c.toLowerCase()))
      email = found ? found.toLowerCase() : ''
    }
    if (!EMAIL_REGEX.test(email) || seen.has(email)) continue
    seen.add(email)

    const row: ImportRow = { email }
    if (dateIdx >= 0 && cells[dateIdx]) {
      const parsed = parseDate(cells[dateIdx])
      if (parsed) row.created_at = parsed
    }
    rows.push(row)
  }
  return rows
}

type ImportResult = {
  total: number
  created: number
  updated: number
  invites_sent: number
  errors: Array<{ email: string; error: string }>
  tier: AccessTier
}

export function CsvImportModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean
  onClose: () => void
  onDone: () => void
}) {
  const [rows, setRows] = useState<ImportRow[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [tier, setTier] = useState<AccessTier>('basic')
  const [sendInvites, setSendInvites] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  function reset() {
    setRows([])
    setFileName(null)
    setTier('basic')
    setSendInvites(false)
    setResult(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleFile(file: File) {
    setError(null)
    setResult(null)
    const text = await file.text()
    const parsed = parseCsv(text)
    setFileName(file.name)
    setRows(parsed)
    if (parsed.length === 0) setError('Keine gültigen E-Mail-Adressen gefunden.')
  }

  async function handleImport() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, access_tier: tier, send_invites: sendInvites }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Import fehlgeschlagen')
      } else {
        setResult(data as ImportResult)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleFinish() {
    reset()
    onDone()
  }

  const datesDetected = rows.filter((r) => r.created_at).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Nutzer via CSV importieren</h2>
          <button
            onClick={handleClose}
            className="text-muted hover:text-foreground p-1 rounded-lg hover:bg-surface-secondary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <Check size={18} />
                <span className="font-semibold">Import abgeschlossen</span>
              </div>
              <div className="text-sm text-foreground space-y-1">
                <p><strong>{result.created}</strong> neue Nutzer angelegt</p>
                <p><strong>{result.updated}</strong> bestehende Nutzer aktualisiert (Tier: <strong>{result.tier}</strong>)</p>
                {result.invites_sent > 0 && (
                  <p><strong>{result.invites_sent}</strong> Einladungs-E-Mails versendet</p>
                )}
                {result.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-red-600 text-sm">
                      {result.errors.length} Fehler anzeigen
                    </summary>
                    <ul className="mt-2 space-y-1 text-xs text-muted max-h-40 overflow-y-auto">
                      {result.errors.map((e, i) => (
                        <li key={i}><span className="font-medium text-foreground">{e.email}</span> — {e.error}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
              <button onClick={handleFinish} className="w-full btn-primary mt-4">
                Fertig
              </button>
            </div>
          ) : (
            <>
              {/* Step 1: File */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  1. CSV-Datei wählen
                </label>
                <p className="text-xs text-muted mb-3">
                  Unterstützte Spalten: <code>email</code> (Pflicht),{' '}
                  <code>created_at</code> oder <code>registriert</code> (optional, für das Registrierungsdatum).
                  Andere Spalten werden ignoriert.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-surface-secondary transition-colors"
                  >
                    <Upload size={14} />
                    Datei auswählen
                  </button>
                  {fileName && (
                    <span className="text-xs text-muted truncate flex-1">{fileName}</span>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                  }}
                />
                {rows.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    {rows.length} E-Mail-Adresse{rows.length === 1 ? '' : 'n'} erkannt
                    {datesDetected > 0 && `, davon ${datesDetected} mit Registrierungsdatum`}.
                  </p>
                )}
              </div>

              {/* Step 2: Tier */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  2. Als welchen Nutzertyp importieren?
                </label>
                <div className="space-y-2">
                  {TIER_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        tier === opt.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-surface-secondary'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tier"
                        value={opt.value}
                        checked={tier === opt.value}
                        onChange={() => setTier(opt.value)}
                        className="mt-0.5 accent-primary"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{opt.label}</div>
                        <div className="text-xs text-muted">{opt.hint}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 3: Invite */}
              <div>
                <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-surface-secondary transition-colors">
                  <input
                    type="checkbox"
                    checked={sendInvites}
                    onChange={(e) => setSendInvites(e.target.checked)}
                    className="mt-0.5 accent-primary"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">
                      Einladungs-E-Mail versenden
                    </div>
                    <div className="text-xs text-muted">
                      Jeder neu angelegte Nutzer bekommt einen Magic-Link zum Einloggen. Bei bestehenden Nutzern passiert nichts. Bleibt das leer, werden User nur stumm hinzugefügt.
                    </div>
                  </div>
                </label>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground rounded-lg"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading || rows.length === 0}
                  className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {rows.length > 0
                    ? `${rows.length} Nutzer als ${TIER_OPTIONS.find((t) => t.value === tier)?.label} importieren`
                    : 'Importieren'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
