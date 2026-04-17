'use client'

import { Lock, Users, Crown, UserCheck } from 'lucide-react'

const DEFAULT_GROUPS = [
  {
    name: 'Premium',
    slug: 'paid',
    description: 'Voller Zugriff auf alle Bereiche',
    permissions: { chat: true, toolbox: true, classroom: true },
    color: 'text-primary bg-primary/10',
    icon: Crown,
    memberCount: '—',
  },
  {
    name: 'Free',
    slug: 'free',
    description: 'Zugriff nur auf Classroom (Lernvideos)',
    permissions: { chat: false, toolbox: false, classroom: true },
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
    icon: UserCheck,
    memberCount: '—',
  },
]

export default function AdminGroupsPage() {
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Gruppen & Rechte</h1>
        <p className="text-sm text-muted">Verwalte Nutzergruppen und deren Berechtigungen.</p>
      </div>

      <div className="space-y-4">
        {DEFAULT_GROUPS.map((group) => (
          <div key={group.slug} className="card-static p-5">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-[var(--radius-lg)] ${group.color} flex items-center justify-center shrink-0`}>
                <group.icon size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{group.name}</h3>
                  <span className="text-xs px-2 py-0.5 bg-surface-secondary text-muted rounded-full">
                    {group.memberCount} Mitglieder
                  </span>
                </div>
                <p className="text-sm text-muted mb-4">{group.description}</p>

                {/* Permissions Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <PermBadge label="Chat / GPT" allowed={group.permissions.chat} />
                  <PermBadge label="KI Toolbox" allowed={group.permissions.toolbox} />
                  <PermBadge label="Classroom" allowed={group.permissions.classroom} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 border border-dashed border-border rounded-[var(--radius-xl)] text-center">
        <p className="text-sm text-muted mb-3">
          Nutzergruppen werden aktuell über das <code className="text-xs bg-surface-secondary px-1.5 py-0.5 rounded">access_tier</code> Feld gesteuert.
        </p>
        <p className="text-xs text-muted">
          Das vollständige Gruppen-System mit eigenen DB-Tabellen wird in einem späteren Update aktiviert.
        </p>
      </div>
    </div>
  )
}

function PermBadge({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium ${
      allowed
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
        : 'bg-surface-secondary text-muted line-through'
    }`}>
      {allowed ? '✓' : '✗'} {label}
    </div>
  )
}
