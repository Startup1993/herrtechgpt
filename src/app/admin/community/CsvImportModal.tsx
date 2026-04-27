'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, X, FileSpreadsheet } from 'lucide-react'

type ParsedRow = { email: string; name?: string; expires_at?: string }

/**
 * Parst eine simple CSV-Zeile (mit/ohne Quoten). Reicht für Skool-Exports.
 * Spalten werden über Header-Namen identifiziert: email, name, expires_at.
 */
function parseCSV(text: string): { rows: ParsedRow[]; columns: string[] } {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  if (lines.length === 0) return { rows: [], columns: [] }

  const splitLine = (line: string): string[] => {
    const parts: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        inQuotes = !inQuotes
      } else if ((c === ',' || c === ';' || c === '\t') && !inQuotes) {
        parts.push(current.trim())
        current = ''
      } else {
        current += c
      }
    }
    parts.push(current.trim())
    return parts
  }

  const header = splitLine(lines[0]).map((h) => h.toLowerCase().trim())
  const emailIdx = header.findIndex((h) => h === 'email' || h === 'e-mail' || h === 'mail')
  // Name kann als ein Feld (name/full name) oder getrennt (firstname + lastname) kommen
  const nameIdx = header.findIndex(
    (h) => h === 'name' || h === 'full name' || h === 'fullname'
  )
  const firstNameIdx = header.findIndex(
    (h) => h === 'firstname' || h === 'first name' || h === 'first_name' || h === 'vorname'
  )
  const lastNameIdx = header.findIndex(
    (h) => h === 'lastname' || h === 'last name' || h === 'last_name' || h === 'nachname'
  )
  const expIdx = header.findIndex(
    (h) =>
      h === 'expires_at' ||
      h === 'expires' ||
      h === 'zugang_bis' ||
      h === 'access_until'
  )
  // Skool-Format: JoinedDate als Beitrittsdatum → +12 Monate als Zugang-bis
  const joinedIdx = header.findIndex(
    (h) =>
      h === 'joineddate' ||
      h === 'joined_date' ||
      h === 'joined' ||
      h === 'beigetreten'
  )

  if (emailIdx === -1) {
    return { rows: [], columns: header }
  }

  const rows: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i])
    const email = cells[emailIdx]?.trim()
    if (!email) continue

    // Name zusammensetzen
    let name: string | undefined = undefined
    if (nameIdx >= 0 && cells[nameIdx]?.trim()) {
      name = cells[nameIdx].trim()
    } else if (firstNameIdx >= 0 || lastNameIdx >= 0) {
      const first = firstNameIdx >= 0 ? cells[firstNameIdx]?.trim() ?? '' : ''
      const last = lastNameIdx >= 0 ? cells[lastNameIdx]?.trim() ?? '' : ''
      const combined = `${first} ${last}`.trim()
      if (combined) name = combined
    }

    // Zugang-bis: explizit > JoinedDate+12 Monate > leer (Backend setzt default)
    let expires_at: string | undefined = undefined
    if (expIdx >= 0 && cells[expIdx]?.trim()) {
      expires_at = cells[expIdx].trim()
    } else if (joinedIdx >= 0 && cells[joinedIdx]?.trim()) {
      const joined = new Date(cells[joinedIdx].trim())
      if (!isNaN(joined.getTime())) {
        const expires = new Date(joined.getTime() + 365 * 86400 * 1000)
        expires_at = expires.toISOString().slice(0, 10)
      }
    }

    rows.push({ email, name, expires_at })
  }

  return { rows, columns: header }
}

export function CsvImportModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<{ rows: ParsedRow[]; columns: string[] } | null>(
    null
  )
  const [result, setResult] = useState<{
    received: number
    valid: number
    invalid: number
    skipped_existing: number
    inserted: number
    errors?: Array<{ email: string; error: string }>
  } | null>(null)

  function close() {
    if (busy) return
    setOpen(false)
    setParsed(null)
    setResult(null)
    setError(null)
  }

  async function onFile(file: File) {
    setError(null)
    setResult(null)
    if (file.size > 5 * 1024 * 1024) {
      setError('Datei zu groß (max 5 MB)')
      return
    }
    try {
      const text = await file.text()
      const result = parseCSV(text)
      if (result.rows.length === 0) {
        setError(
          `Keine gültigen Zeilen gefunden. Header gefunden: ${result.columns.join(', ') || '—'}. Spalte "email" notwendig.`
        )
        setParsed(null)
        return
      }
      setParsed(result)
    } catch {
      setError('Datei konnte nicht gelesen werden')
    }
  }

  async function submit() {
    if (!parsed) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/community/csv-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsed.rows }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? 'Import fehlgeschlagen')
      } else {
        setResult(data)
        router.refresh()
      }
    } catch {
      setError('Netzwerk-Fehler')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-surface-hover text-foreground text-sm transition"
      >
        <FileSpreadsheet className="w-4 h-4" />
        CSV importieren
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  CSV-Import (Skool-Member)
                </h2>
                <p className="text-xs text-muted mt-1">
                  Lade einen CSV-Export aus Skool hoch. Pflicht:{' '}
                  <code className="text-foreground">Email</code>. Optional:{' '}
                  <code className="text-foreground">FirstName + LastName</code> (oder{' '}
                  <code className="text-foreground">Name</code>),{' '}
                  <code className="text-foreground">JoinedDate</code> (als Zugang +12 Mo.) oder{' '}
                  <code className="text-foreground">expires_at</code>. Bestehende E-Mails werden übersprungen.
                </p>
              </div>
              <button
                onClick={close}
                className="p-1 rounded-md hover:bg-surface-hover text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {!parsed && !result && (
                <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-surface-hover transition">
                  <Upload className="w-8 h-8 text-muted" />
                  <div className="text-sm font-medium text-foreground">
                    CSV-Datei wählen
                  </div>
                  <div className="text-xs text-muted">
                    .csv (max 5 MB, max 5000 Zeilen)
                  </div>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) onFile(f)
                    }}
                  />
                </label>
              )}

              {parsed && !result && (
                <div className="space-y-3">
                  <div className="bg-surface-secondary border border-border rounded-lg p-4 text-sm">
                    <div className="font-medium text-foreground mb-2">
                      {parsed.rows.length} Zeilen gefunden
                    </div>
                    <div className="text-xs text-muted">
                      Spalten: {parsed.columns.join(', ')}
                    </div>
                    {parsed.rows.length > 0 && (
                      <div className="mt-3 text-xs text-muted">
                        Erste 3 Zeilen:
                        <ul className="mt-1 space-y-1 text-foreground">
                          {parsed.rows.slice(0, 3).map((r, i) => (
                            <li key={i} className="font-mono">
                              {r.email}
                              {r.name ? ` · ${r.name}` : ''}
                              {r.expires_at ? ` · bis ${r.expires_at}` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-4 text-sm space-y-1">
                  <div className="font-medium text-green-700 dark:text-green-400">
                    Import abgeschlossen
                  </div>
                  <div className="text-foreground text-xs">
                    {result.received} Zeilen erhalten · {result.inserted} neu hinzugefügt ·{' '}
                    {result.skipped_existing} schon vorhanden · {result.invalid} ungültig
                  </div>
                  {result.errors?.length ? (
                    <div className="text-red-600 text-xs mt-2">
                      {result.errors.length} Fehler bei Insert
                    </div>
                  ) : null}
                </div>
              )}

              {error && (
                <div className="text-sm px-3 py-2 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={close}
                  disabled={busy}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-surface-hover text-sm transition disabled:opacity-50"
                >
                  {result ? 'Schließen' : 'Abbrechen'}
                </button>
                {parsed && !result && (
                  <button
                    onClick={submit}
                    disabled={busy}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {parsed.rows.length} Zeilen importieren
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
