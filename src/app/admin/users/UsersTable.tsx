'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CsvImportModal } from './CsvImportModal'
import { CreateUserModal } from './CreateUserModal'
import { Plus } from 'lucide-react'

type AccessTier = 'basic' | 'alumni' | 'premium'
type UserStatus = 'active' | 'invited' | 'added'
type SubStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'ended'
type PlanTier = 'S' | 'M' | 'L'

interface SubscriptionInfo {
  plan_id: string
  plan_tier: PlanTier
  plan_name: string
  status: SubStatus
  billing_cycle: 'monthly' | 'yearly'
  cancel_at_period_end: boolean
  current_period_end: string | null
}

interface UserRow {
  id: string
  email: string
  role: 'user' | 'admin'
  access_tier: AccessTier
  created_at: string
  last_active: string | null
  conversation_count: number
  has_logged_in: boolean
  invitation_sent_count: number
  subscription: SubscriptionInfo | null
}

type TierFilter = 'all' | AccessTier
type StatusFilter = 'all' | UserStatus
type RoleFilter = 'all' | 'user' | 'admin'
type SubFilter =
  | 'all'
  | 'any_active'
  | 'none'
  | 'cancelling'
  | 'past_due'
  | 'plan_s'
  | 'plan_m'
  | 'plan_l'

type SortKey = 'email' | 'created_at' | 'last_active' | 'conversation_count' | 'access_tier' | 'subscription'
type SortDir = 'asc' | 'desc'

const TIER_META: Record<AccessTier, { label: string; className: string }> = {
  premium: {
    label: '✓ Community',
    className: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  },
  alumni: {
    label: 'Alumni',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  },
  basic: {
    label: 'Basic',
    className: 'bg-surface-secondary text-muted',
  },
}

const STATUS_META: Record<UserStatus, { label: string; dot: string; text: string }> = {
  active:  { label: 'Aktiv',         dot: 'bg-green-500',  text: 'text-green-600 dark:text-green-400' },
  invited: { label: 'Eingeladen',    dot: 'bg-amber-400',  text: 'text-amber-700 dark:text-amber-400' },
  added:   { label: 'Hinzugefügt',   dot: 'bg-gray-400',   text: 'text-muted' },
}

function computeStatus(u: UserRow): UserStatus {
  if (u.has_logged_in) return 'active'
  if (u.invitation_sent_count > 0) return 'invited'
  return 'added'
}

function subRank(s: SubscriptionInfo | null): number {
  // für Sortierung: Kein Abo < Past Due < Cancelling < Plan S < Plan M < Plan L
  if (!s) return 0
  if (s.status === 'past_due') return 1
  if (s.cancel_at_period_end) return 2
  return s.plan_tier === 'S' ? 3 : s.plan_tier === 'M' ? 4 : 5
}

export default function UsersTable({ users }: { users: UserRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filterTier, setFilterTier] = useState<TierFilter>('all')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [filterRole, setFilterRole] = useState<RoleFilter>('all')
  const [filterSub, setFilterSub] = useState<SubFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [importOpen, setImportOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const withStatus = useMemo(
    () => users.map((u) => ({ ...u, _status: computeStatus(u) as UserStatus })),
    [users]
  )

  function matchesSubFilter(sub: SubscriptionInfo | null, f: SubFilter): boolean {
    if (f === 'all') return true
    if (f === 'none') return !sub
    if (!sub) return false
    if (f === 'any_active') return sub.status === 'active' || sub.status === 'trialing'
    if (f === 'cancelling') return sub.cancel_at_period_end
    if (f === 'past_due') return sub.status === 'past_due'
    if (f === 'plan_s') return sub.plan_tier === 'S'
    if (f === 'plan_m') return sub.plan_tier === 'M'
    if (f === 'plan_l') return sub.plan_tier === 'L'
    return true
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return withStatus
      .filter((u) => u.email.toLowerCase().includes(q))
      .filter((u) => filterTier === 'all' || u.access_tier === filterTier)
      .filter((u) => filterStatus === 'all' || u._status === filterStatus)
      .filter((u) => filterRole === 'all' || u.role === filterRole)
      .filter((u) => matchesSubFilter(u.subscription, filterSub))
  }, [withStatus, search, filterTier, filterStatus, filterRole, filterSub])

  const sorted = useMemo(() => {
    const tierRank: Record<AccessTier, number> = { basic: 0, alumni: 1, premium: 2 }
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'email':
          cmp = a.email.localeCompare(b.email)
          break
        case 'created_at':
          cmp = (a.created_at ?? '').localeCompare(b.created_at ?? '')
          break
        case 'last_active':
          cmp = (a.last_active ?? '').localeCompare(b.last_active ?? '')
          break
        case 'conversation_count':
          cmp = a.conversation_count - b.conversation_count
          break
        case 'access_tier':
          cmp = tierRank[a.access_tier] - tierRank[b.access_tier]
          break
        case 'subscription':
          cmp = subRank(a.subscription) - subRank(b.subscription)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'email' || key === 'access_tier' ? 'asc' : 'desc')
    }
  }

  function resetFilters() {
    setSearch('')
    setFilterTier('all')
    setFilterStatus('all')
    setFilterRole('all')
    setFilterSub('all')
  }

  const filtersActive =
    search !== '' ||
    filterTier !== 'all' ||
    filterStatus !== 'all' ||
    filterRole !== 'all' ||
    filterSub !== 'all'

  // Counts pro Option (vor Anwendung des eigenen Filters, aber mit den anderen)
  // → simpel: nur globale Gesamtzahl zeigen, reicht fürs Menü
  const total = users.length
  const activeSubCount = users.filter(
    (u) => u.subscription && (u.subscription.status === 'active' || u.subscription.status === 'trialing')
  ).length

  async function deleteUser(userId: string) {
    setLoading(userId + '_delete')
    await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
    setLoading(null)
    setDeleteConfirm(null)
    router.refresh()
  }

  async function sendInvite(userId: string) {
    setLoading(userId + '_invite')
    try {
      const res = await fetch('/api/admin/users/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`Einladung fehlgeschlagen: ${data.error ?? 'Unbekannter Fehler'}`)
      } else {
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function timeAgo(iso: string | null) {
    if (!iso) return '—'
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Heute'
    if (days === 1) return 'Gestern'
    if (days < 7) return `vor ${days} Tagen`
    if (days < 30) return `vor ${Math.floor(days / 7)} Wo.`
    return formatDate(iso)
  }

  return (
    <div className="space-y-4">
      {/* Zeile 1: Suche + CSV-Import */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Nutzer suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors whitespace-nowrap"
        >
          <Plus size={15} />
          Nutzer hinzufügen
        </button>
        <button
          onClick={() => setImportOpen(true)}
          className="px-3 py-2 rounded-lg text-sm font-medium border border-border bg-surface text-foreground hover:bg-surface-secondary transition-colors whitespace-nowrap"
        >
          CSV importieren
        </button>
      </div>

      {/* Zeile 2: Filter-Dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Zugang"
          value={filterTier}
          onChange={(v) => setFilterTier(v as TierFilter)}
          options={[
            { value: 'all', label: `Alle (${total})` },
            { value: 'premium', label: 'Community' },
            { value: 'alumni', label: 'Alumni' },
            { value: 'basic', label: 'Basic' },
          ]}
        />
        <FilterSelect
          label="Abo"
          value={filterSub}
          onChange={(v) => setFilterSub(v as SubFilter)}
          options={[
            { value: 'all', label: 'Alle' },
            { value: 'any_active', label: `Mit aktivem Abo (${activeSubCount})` },
            { value: 'none', label: 'Ohne Abo' },
            { value: 'plan_s', label: 'Plan S' },
            { value: 'plan_m', label: 'Plan M' },
            { value: 'plan_l', label: 'Plan L' },
            { value: 'cancelling', label: 'Läuft aus (gekündigt)' },
            { value: 'past_due', label: 'Zahlung offen' },
          ]}
        />
        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={(v) => setFilterStatus(v as StatusFilter)}
          options={[
            { value: 'all', label: 'Alle' },
            { value: 'active', label: 'Aktiv' },
            { value: 'invited', label: 'Eingeladen' },
            { value: 'added', label: 'Hinzugefügt' },
          ]}
        />
        <FilterSelect
          label="Rolle"
          value={filterRole}
          onChange={(v) => setFilterRole(v as RoleFilter)}
          options={[
            { value: 'all', label: 'Alle' },
            { value: 'user', label: 'Nutzer' },
            { value: 'admin', label: 'Admin' },
          ]}
        />
        <FilterSelect
          label="Sortierung"
          value={`${sortKey}:${sortDir}`}
          onChange={(v) => {
            const [k, d] = v.split(':') as [SortKey, SortDir]
            setSortKey(k)
            setSortDir(d)
          }}
          options={[
            { value: 'created_at:desc', label: 'Registriert (neu → alt)' },
            { value: 'created_at:asc', label: 'Registriert (alt → neu)' },
            { value: 'last_active:desc', label: 'Letzte Aktivität (neu → alt)' },
            { value: 'last_active:asc', label: 'Letzte Aktivität (alt → neu)' },
            { value: 'email:asc', label: 'E-Mail (A → Z)' },
            { value: 'email:desc', label: 'E-Mail (Z → A)' },
            { value: 'conversation_count:desc', label: 'Chats (meisten)' },
            { value: 'conversation_count:asc', label: 'Chats (wenigsten)' },
            { value: 'access_tier:desc', label: 'Zugang (höchster)' },
            { value: 'subscription:desc', label: 'Abo (höchstes)' },
          ]}
        />
        {filtersActive && (
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground border border-border rounded-lg bg-surface hover:bg-surface-secondary transition-colors whitespace-nowrap"
          >
            × Filter zurücksetzen
          </button>
        )}
      </div>

      <CsvImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onDone={() => {
          setImportOpen(false)
          router.refresh()
        }}
      />

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onDone={() => {
          setCreateOpen(false)
          router.refresh()
        }}
      />

      {/* Tabelle */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-secondary">
              <SortableTh label="E-Mail" sortKey="email" current={sortKey} dir={sortDir} onClick={toggleSort} align="left" />
              <SortableTh label="Zugang" sortKey="access_tier" current={sortKey} dir={sortDir} onClick={toggleSort} align="left" />
              <SortableTh label="Abo" sortKey="subscription" current={sortKey} dir={sortDir} onClick={toggleSort} align="left" />
              <SortableTh label="Registriert" sortKey="created_at" current={sortKey} dir={sortDir} onClick={toggleSort} align="left" />
              <SortableTh label="Status" sortKey="last_active" current={sortKey} dir={sortDir} onClick={toggleSort} align="left" />
              <SortableTh label="Chats" sortKey="conversation_count" current={sortKey} dir={sortDir} onClick={toggleSort} align="center" />
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Rolle</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-sm text-muted">
                  Keine Nutzer gefunden.
                </td>
              </tr>
            )}
            {sorted.map((u) => {
              const tier = TIER_META[u.access_tier]
              const status = STATUS_META[u._status]
              return (
                <tr
                  key={u.id}
                  className="hover:bg-surface-secondary/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/users/${u.id}`)}
                >
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-foreground underline decoration-transparent hover:decoration-primary transition-colors">{u.email}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tier.className}`}>
                      {tier.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <SubscriptionBadge sub={u.subscription} />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${status.dot}`} />
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
                        <span className="text-[11px] text-muted truncate">
                          {u._status === 'active'
                            ? timeAgo(u.last_active)
                            : u._status === 'invited'
                              ? `${u.invitation_sent_count}× versendet`
                              : 'Noch nicht eingeladen'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-sm font-medium text-foreground">{u.conversation_count}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-surface-secondary text-muted'
                    }`}>
                      {u.role === 'admin' ? 'Admin' : 'Nutzer'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                      {!u.has_logged_in && (
                        <button
                          onClick={() => sendInvite(u.id)}
                          disabled={!!loading}
                          className="text-xs text-primary hover:text-primary-hover border border-primary/30 px-2.5 py-1.5 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50 whitespace-nowrap"
                          title={u.invitation_sent_count === 0 ? 'Magic-Link per E-Mail versenden' : `Bereits ${u.invitation_sent_count}× versendet — erneut senden`}
                        >
                          {loading === u.id + '_invite'
                            ? '...'
                            : `Einladung ${u.invitation_sent_count > 0 ? `(${u.invitation_sent_count})` : 'senden'}`}
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                        className="text-xs text-muted hover:text-foreground border border-border px-2.5 py-1.5 rounded-lg hover:bg-surface-secondary transition-colors whitespace-nowrap"
                      >
                        Details
                      </button>

                      {deleteConfirm === u.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteUser(u.id)}
                            disabled={!!loading}
                            className="text-xs bg-red-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {loading === u.id + '_delete' ? '...' : 'Bestätigen'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs text-muted hover:text-foreground px-2 py-1.5"
                          >
                            Abbruch
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(u.id)}
                          disabled={!!loading}
                          className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Löschen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">{sorted.length} von {users.length} Nutzern</p>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const isDefault = value === 'all' || value.startsWith('created_at:desc')
  return (
    <label className="inline-flex items-center gap-1.5">
      <span className="text-xs text-muted uppercase tracking-wider font-medium">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg border cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            isDefault
              ? 'bg-surface border-border text-foreground hover:bg-surface-secondary'
              : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/15'
          }`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </label>
  )
}

function SortableTh({
  label,
  sortKey,
  current,
  dir,
  onClick,
  align,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onClick: (k: SortKey) => void
  align: 'left' | 'center'
}) {
  const active = current === sortKey
  return (
    <th className={`${align === 'center' ? 'text-center' : 'text-left'} px-4 py-3`}>
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
          active ? 'text-foreground' : 'text-muted hover:text-foreground'
        }`}
      >
        {label}
        <span className={`text-[10px] leading-none ${active ? 'opacity-100' : 'opacity-30'}`}>
          {active ? (dir === 'asc' ? '▲' : '▼') : '▾'}
        </span>
      </button>
    </th>
  )
}

function SubscriptionBadge({ sub }: { sub: SubscriptionInfo | null }) {
  if (!sub) {
    return <span className="text-xs text-muted">—</span>
  }

  const tierLabel = `Plan ${sub.plan_tier}`
  const cycle = sub.billing_cycle === 'yearly' ? 'jährlich' : 'monatlich'

  if (sub.status === 'past_due') {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 w-fit">
          {tierLabel} · Zahlung offen
        </span>
        <span className="text-[10px] text-muted">{cycle}</span>
      </div>
    )
  }

  if (sub.cancel_at_period_end) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 w-fit">
          {tierLabel} · läuft aus
        </span>
        <span className="text-[10px] text-muted">
          {cycle}
          {sub.current_period_end && ` · bis ${new Date(sub.current_period_end).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}`}
        </span>
      </div>
    )
  }

  const isTrialing = sub.status === 'trialing'
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
        isTrialing
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
          : 'bg-primary/10 text-primary'
      }`}>
        {tierLabel}
        {isTrialing && ' · Trial'}
      </span>
      <span className="text-[10px] text-muted">{cycle}</span>
    </div>
  )
}
