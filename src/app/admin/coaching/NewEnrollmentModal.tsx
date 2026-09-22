'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, X } from 'lucide-react'
import { COACH_OPTIONS, TRACK_OPTIONS, WORLD_MODE_META } from '@/lib/coaching/types'

export function NewEnrollmentModal({ programs, onClose }: { programs: Array<{ key: string; title: string }>; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({
    client_name: '', client_email: '', company: '', coach_name: 'Jacob', program_key: programs[0]?.key ?? 'coaching_1zu1',
    world_mode: 'program_only', track: '', starts_at: new Date().toISOString().slice(0, 10), status: 'active',
    north_star: '', success_quote: '', create_account: true, send_invite: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    const res = await fetch('/api/admin/coaching/enrollments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const json = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Fehler beim Anlegen'); return }
    if (json.invite_error) alert(`Teilnahme angelegt, Einladung fehlgeschlagen: ${json.invite_error}`)
    router.push(`/admin/coaching/${json.enrollment.id}`)
    router.refresh()
  }

  const input = 'w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-background border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Neue Teilnahme</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground p-1" aria-label="Schließen"><X size={18} /></button>
        </div>
        <p className="text-xs text-muted">Normalweg ist das Plugin (<code>/neuer-kunde</code>), damit Notion, Drive und Cockpit zusammenbleiben. Das hier ist der Handweg.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Name *</span><input required className={input} value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Vorname Nachname" /></label>
          <label className="block"><span className="text-xs font-medium text-muted mb-1 block">E-Mail</span><input type="email" className={input} value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} placeholder="kunde@firma.de" /></label>
          <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Firma</span><input className={input} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
          <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Coach</span>
            <select className={input} value={form.coach_name} onChange={(e) => setForm({ ...form, coach_name: e.target.value })}>{COACH_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
          <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Programm</span>
            <select className={input} value={form.program_key} onChange={(e) => setForm({ ...form, program_key: e.target.value })}>{programs.map((p) => <option key={p.key} value={p.key}>{p.title}</option>)}</select></label>
          <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Track</span>
            <select className={input} value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })}><option value="">offen</option>{TRACK_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
          <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Start</span><input type="date" className={input} value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></label>
          <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Status</span>
            <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">aktiv</option><option value="completed">abgeschlossen (Bestandskunde)</option><option value="paused">pausiert</option></select></label>
        </div>
        <label className="block"><span className="text-xs font-medium text-muted mb-1 block">World-Zugang</span>
          <select className={input} value={form.world_mode} onChange={(e) => setForm({ ...form, world_mode: e.target.value })}>
            {(Object.keys(WORLD_MODE_META) as Array<keyof typeof WORLD_MODE_META>).map((k) => <option key={k} value={k}>{WORLD_MODE_META[k].label} · {WORLD_MODE_META[k].hint}</option>)}
          </select></label>
        <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Nordstern (ein Satz)</span><input className={input} value={form.north_star} onChange={(e) => setForm({ ...form, north_star: e.target.value })} placeholder="Reichweite. Nur Reichweite." /></label>
        <label className="block"><span className="text-xs font-medium text-muted mb-1 block">Erfolgs-Zitat (wörtlich aus dem Kickoff)</span><input className={input} value={form.success_quote} onChange={(e) => setForm({ ...form, success_quote: e.target.value })} placeholder="Masse Masse Masse" /></label>
        <div className="rounded-lg border border-border p-3 space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.create_account} disabled={!form.client_email} onChange={(e) => setForm({ ...form, create_account: e.target.checked, send_invite: e.target.checked ? form.send_invite : false })} /> World-Account anlegen oder verknüpfen (braucht E-Mail)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.send_invite} disabled={!form.create_account} onChange={(e) => setForm({ ...form, send_invite: e.target.checked })} /> Einladung „Dein Coaching-Zugang“ sofort senden</label>
          <p className="text-xs text-muted">Für abgeschlossene Bestandskunden beide Haken weglassen: Sie erscheinen im Cockpit und in der Statistik, bekommen aber keinen Login.</p>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Abbrechen</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Anlegen</button>
        </div>
      </form>
    </div>
  )
}
