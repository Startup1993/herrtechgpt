'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/theme-context'
import { createClient } from '@/lib/supabase/client'
import { Sun, Moon, User, Mail, Trash2, GraduationCap, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AccountPage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [profile, setProfile] = useState<Record<string, string>>({})
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')

      const { data } = await supabase
        .from('profiles')
        .select('background, market, target_audience, offer')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('profiles').update({
      background: profile.background ?? '',
      market: profile.market ?? '',
      target_audience: profile.target_audience ?? '',
      offer: profile.offer ?? '',
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)

    setSaving(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'LÖSCHEN') return
    const supabase = createClient()
    // Actual deletion would need a server-side admin API call
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Einstellungen</h1>
        <p className="text-sm text-muted">Verwalte dein Profil und Account.</p>
      </div>

      {/* Erscheinungsbild */}
      <section className="card-static p-5 mb-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          Erscheinungsbild
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Dark Mode</p>
            <p className="text-xs text-muted">Wechsle zwischen hellem und dunklem Design.</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${
              theme === 'dark' ? 'bg-primary' : 'bg-border'
            }`}
            aria-label="Dark Mode Toggle"
          >
            <div
              className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-200"
              style={{ transform: theme === 'dark' ? 'translateX(24px)' : 'translateX(0)' }}
            >
              {theme === 'dark' ? <Moon size={12} className="text-primary" /> : <Sun size={12} className="text-amber-500" />}
            </div>
          </button>
        </div>
      </section>

      {/* Account Info */}
      <section className="card-static p-5 mb-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <User size={16} />
          Account
        </h2>
        <div className="flex items-center gap-3 px-3 py-2.5 bg-surface-secondary rounded-[var(--radius-lg)]">
          <Mail size={16} className="text-muted" />
          <span className="text-sm text-foreground">{email}</span>
        </div>
      </section>

      {/* Profil / Wissensbasis */}
      <section className="card-static p-5 mb-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <GraduationCap size={16} />
          Profil & Wissensbasis
        </h2>
        <div className="space-y-4">
          {[
            { key: 'background', label: 'Über dich', placeholder: 'z.B. Creator & Unternehmer...' },
            { key: 'market', label: 'Deine Nische', placeholder: 'z.B. Online-Kurse rund um KI...' },
            { key: 'target_audience', label: 'Zielgruppe', placeholder: 'z.B. Unternehmer, 25-45...' },
            { key: 'offer', label: 'Angebote', placeholder: 'z.B. KI-Masterkurs, Membership...' },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-muted mb-1.5">{field.label}</label>
              <textarea
                value={profile[field.key] ?? ''}
                onChange={(e) => setProfile((p) => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          ))}
          <button onClick={handleSaveProfile} disabled={saving} className="btn-primary w-full justify-center">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Speichere...</> : 'Profil speichern'}
          </button>
        </div>
      </section>

      {/* Lernpfad */}
      <section className="card-static p-5 mb-5">
        <h2 className="text-sm font-semibold text-foreground mb-2">Lernpfad</h2>
        <p className="text-xs text-muted mb-3">Starte das Onboarding neu um deinen Lernpfad anzupassen.</p>
        <Link href="/dashboard/onboarding" className="btn-ghost border border-border inline-flex text-sm">
          Onboarding wiederholen
        </Link>
      </section>

      {/* Gefahrenzone */}
      <section className="card-static p-5 border-danger/30">
        <h2 className="text-sm font-semibold text-danger mb-2 flex items-center gap-2">
          <Trash2 size={16} />
          Gefahrenzone
        </h2>
        {!showDelete ? (
          <div>
            <p className="text-xs text-muted mb-3">Account und alle Daten unwiderruflich löschen.</p>
            <button
              onClick={() => setShowDelete(true)}
              className="text-xs text-danger hover:text-white hover:bg-danger border border-danger/30 px-3 py-1.5 rounded-[var(--radius-md)] transition-colors"
            >
              Account löschen
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs text-danger mb-3">
              Bist du sicher? Tippe <strong>LÖSCHEN</strong> ein um zu bestätigen.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="LÖSCHEN"
              className="w-full px-3 py-2 border border-danger/30 rounded-[var(--radius-md)] bg-background text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-danger/30"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'LÖSCHEN'}
                className="text-xs bg-danger text-white px-4 py-2 rounded-[var(--radius-md)] disabled:opacity-30 transition-colors hover:bg-red-700"
              >
                Endgültig löschen
              </button>
              <button
                onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                className="text-xs text-muted hover:text-foreground px-3 py-2"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
