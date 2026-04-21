'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Mail, Shield, Calendar, MessageSquare, User, Save, Loader2 } from 'lucide-react'

type AccessTier = 'basic' | 'alumni' | 'premium'

interface UserData {
  id: string
  email: string
  role: string
  accessTier: AccessTier
  createdAt: string
  lastSignIn: string | null
  background: string
  market: string
  targetAudience: string
  offer: string
  experienceLevel: string
  primaryGoal: string
  hasLearningPath: boolean
}

interface Stats {
  totalConversations: number
  totalMessages: number
  userMessages: number
  agentUsage: { id: string; name: string; emoji: string; count: number }[]
  recentConversations: {
    id: string; agentId: string; agentName: string; agentEmoji: string
    title: string; createdAt: string; updatedAt: string; messageCount: number
  }[]
}

const TIER_OPTIONS: { value: AccessTier; label: string; hint: string }[] = [
  { value: 'premium', label: 'Community (Premium)', hint: 'Aktives KI Marketing Club Mitglied — voller Zugriff' },
  { value: 'alumni', label: 'Alumni', hint: 'Ehemalig — Classroom lebenslang frei, Chat & Toolbox gesperrt' },
  { value: 'basic', label: 'Basic (Free)', hint: 'Noch kein Zugriff — muss Module einzeln erkaufen' },
]

export function UserDetailClient({ user, stats }: { user: UserData; stats: Stats }) {
  const router = useRouter()
  const [form, setForm] = useState({
    email: user.email,
    role: user.role,
    accessTier: user.accessTier,
    background: user.background,
    market: user.market,
    targetAudience: user.targetAudience,
    offer: user.offer,
    experienceLevel: user.experienceLevel,
    primaryGoal: user.primaryGoal,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty =
    form.email !== user.email ||
    form.role !== user.role ||
    form.accessTier !== user.accessTier ||
    form.background !== user.background ||
    form.market !== user.market ||
    form.targetAudience !== user.targetAudience ||
    form.offer !== user.offer ||
    form.experienceLevel !== user.experienceLevel ||
    form.primaryGoal !== user.primaryGoal

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const payload: Record<string, string> = { userId: user.id }
    if (form.email !== user.email) payload.email = form.email.trim()
    if (form.role !== user.role) payload.role = form.role
    if (form.accessTier !== user.accessTier) payload.access_tier = form.accessTier
    if (form.background !== user.background) payload.background = form.background
    if (form.market !== user.market) payload.market = form.market
    if (form.targetAudience !== user.targetAudience) payload.target_audience = form.targetAudience
    if (form.offer !== user.offer) payload.offer = form.offer
    if (form.experienceLevel !== user.experienceLevel) payload.experience_level = form.experienceLevel
    if (form.primaryGoal !== user.primaryGoal) payload.primary_goal = form.primaryGoal

    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Fehler beim Speichern')
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const tierBadgeClass = form.accessTier === 'premium'
    ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
    : form.accessTier === 'alumni'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
      : 'bg-surface-secondary text-muted'

  const tierLabel = form.accessTier === 'premium' ? 'Community' : form.accessTier === 'alumni' ? 'Alumni' : 'Basic'

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/users" className="text-muted hover:text-foreground transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{user.email}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              form.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-surface-secondary text-muted'
            }`}>{form.role === 'admin' ? 'Admin' : 'Nutzer'}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierBadgeClass}`}>{tierLabel}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats + Account */}
        <div className="lg:col-span-1 space-y-5">
          {/* Quick Stats */}
          <div className="card-static p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Statistiken</h2>
            <div className="space-y-3">
              <StatRow icon={<MessageSquare size={14} />} label="Gespräche" value={String(stats.totalConversations)} />
              <StatRow icon={<Mail size={14} />} label="Nachrichten gesamt" value={String(stats.totalMessages)} />
              <StatRow icon={<User size={14} />} label="Davon vom Nutzer" value={String(stats.userMessages)} />
              <StatRow icon={<Calendar size={14} />} label="Registriert" value={formatDate(user.createdAt)} />
              <StatRow icon={<Calendar size={14} />} label="Letzter Login" value={formatDate(user.lastSignIn)} />
              <StatRow icon={<Shield size={14} />} label="Lernpfad" value={user.hasLearningPath ? 'Erstellt' : 'Nicht erstellt'} />
            </div>
          </div>

          {/* Agent Usage */}
          {stats.agentUsage.length > 0 && (
            <div className="card-static p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Genutzte Agenten</h2>
              <div className="space-y-2">
                {stats.agentUsage.map(a => (
                  <div key={a.id} className="flex items-center gap-2">
                    <span className="text-sm">{a.emoji}</span>
                    <span className="text-sm text-foreground flex-1 truncate">{a.name}</span>
                    <span className="text-xs text-muted">{a.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Account */}
          <div className="card-static p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Account</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="E-Mail" span2>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </Field>
              <Field label="Rolle">
                <select
                  value={form.role}
                  onChange={(e) => set('role', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="user">Nutzer</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>
              <Field label="Zugang">
                <select
                  value={form.accessTier}
                  onChange={(e) => set('accessTier', e.target.value as AccessTier)}
                  className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {TIER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-muted mt-1 leading-snug">
                  {TIER_OPTIONS.find((o) => o.value === form.accessTier)?.hint}
                </p>
              </Field>
            </div>
          </div>

          {/* Profile Info */}
          <div className="card-static p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Profil</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Erfahrungslevel">
                <input
                  type="text"
                  value={form.experienceLevel}
                  onChange={(e) => set('experienceLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </Field>
              <Field label="Hauptziel">
                <input
                  type="text"
                  value={form.primaryGoal}
                  onChange={(e) => set('primaryGoal', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </Field>
              <Field label="Hintergrund" span2>
                <textarea
                  value={form.background}
                  onChange={(e) => set('background', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                />
              </Field>
              <Field label="Markt / Nische" span2>
                <textarea
                  value={form.market}
                  onChange={(e) => set('market', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                />
              </Field>
              <Field label="Zielgruppe" span2>
                <textarea
                  value={form.targetAudience}
                  onChange={(e) => set('targetAudience', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                />
              </Field>
              <Field label="Angebote" span2>
                <textarea
                  value={form.offer}
                  onChange={(e) => set('offer', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                />
              </Field>
            </div>
          </div>

          {/* Save Bar */}
          <div className="sticky bottom-4 z-10">
            <div className="card-static p-4 flex items-center gap-3 shadow-lg">
              <div className="flex-1 text-xs text-muted">
                {error ? <span className="text-red-500">{error}</span> :
                 dirty ? 'Ungespeicherte Änderungen' :
                 saved ? '✓ Gespeichert' : 'Keine Änderungen'}
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="btn-primary justify-center disabled:opacity-40"
              >
                {saving ? <><Loader2 size={14} className="animate-spin" /> Speichere...</> :
                 <><Save size={14} /> Speichern</>}
              </button>
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="card-static overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Letzte Gespräche</h2>
            </div>
            {stats.recentConversations.length === 0 ? (
              <div className="p-5 text-sm text-muted text-center">Noch keine Gespräche.</div>
            ) : (
              <div className="divide-y divide-border">
                {stats.recentConversations.map(conv => (
                  <div key={conv.id} className="px-5 py-3 flex items-center gap-3">
                    <span className="text-base shrink-0">{conv.agentEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{conv.title}</p>
                      <p className="text-xs text-muted">{conv.agentName} · {conv.messageCount} Nachrichten</p>
                    </div>
                    <span className="text-xs text-muted shrink-0">{formatDate(conv.updatedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-muted">{icon}</span>
      <span className="text-xs text-muted flex-1">{label}</span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  )
}

function Field({ label, children, span2 }: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-medium text-muted mb-1.5">{label}</label>
      {children}
    </div>
  )
}
