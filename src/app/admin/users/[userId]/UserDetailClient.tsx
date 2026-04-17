'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Mail, Shield, Crown, Calendar, MessageSquare, User, Save, Loader2 } from 'lucide-react'

interface UserData {
  id: string
  email: string
  role: string
  accessTier: string
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

export function UserDetailClient({ user, stats }: { user: UserData; stats: Stats }) {
  const router = useRouter()
  const [role, setRole] = useState(user.role)
  const [accessTier, setAccessTier] = useState(user.accessTier)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, role, access_tier: accessTier }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

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
              user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-surface-secondary text-muted'
            }`}>{role === 'admin' ? 'Admin' : 'Nutzer'}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              accessTier === 'premium' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-surface-secondary text-muted'
            }`}>{accessTier === 'premium' ? 'Premium' : 'Basic'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats + Edit */}
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

          {/* Edit Role & Tier */}
          <div className="card-static p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Bearbeiten</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Rolle</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="user">Nutzer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Zugang</label>
                <select
                  value={accessTier}
                  onChange={(e) => setAccessTier(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="basic">Basic (Free)</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || (role === user.role && accessTier === user.accessTier)}
                className="btn-primary w-full justify-center disabled:opacity-40"
              >
                {saving ? <><Loader2 size={14} className="animate-spin" /> Speichere...</> :
                 saved ? '✓ Gespeichert' :
                 <><Save size={14} /> Änderungen speichern</>}
              </button>
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

        {/* Right Column: Profile + Conversations */}
        <div className="lg:col-span-2 space-y-5">
          {/* Profile Info */}
          <div className="card-static p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Profil</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileField label="Erfahrungslevel" value={user.experienceLevel} />
              <ProfileField label="Hauptziel" value={user.primaryGoal} />
              <ProfileField label="Hintergrund" value={user.background} span2 />
              <ProfileField label="Markt / Nische" value={user.market} span2 />
              <ProfileField label="Zielgruppe" value={user.targetAudience} span2 />
              <ProfileField label="Angebote" value={user.offer} span2 />
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

function ProfileField({ label, value, span2 }: { label: string; value: string; span2?: boolean }) {
  return (
    <div className={span2 ? 'sm:col-span-2' : ''}>
      <span className="text-xs text-muted block mb-1">{label}</span>
      <p className="text-sm text-foreground">{value || '—'}</p>
    </div>
  )
}
