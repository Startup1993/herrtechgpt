'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Ticket, MessageSquare, User, Clock, Circle } from 'lucide-react'

interface TicketItem {
  id: string
  userId: string
  userEmail: string
  title: string
  messageCount: number
  lastMessage: string
  createdAt: string
  updatedAt: string
  hasUnread: boolean
}

export function TicketsClient({ tickets }: { tickets: TicketItem[] }) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filtered = filter === 'unread'
    ? tickets.filter(t => t.hasUnread)
    : tickets

  const unreadCount = tickets.filter(t => t.hasUnread).length

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const now = Date.now()
    const diff = now - d.getTime()
    if (diff < 3600000) return `vor ${Math.floor(diff / 60000)} Min.`
    if (diff < 86400000) return `vor ${Math.floor(diff / 3600000)}h`
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support-Tickets</h1>
          <p className="text-sm text-muted mt-1">
            {tickets.length} Anfragen{unreadCount > 0 && ` · ${unreadCount} ungelesen`}
          </p>
        </div>
        <div className="flex gap-1.5">
          <FilterBtn label={`Alle (${tickets.length})`} active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterBtn label={`Ungelesen (${unreadCount})`} active={filter === 'unread'} onClick={() => setFilter('unread')} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card-static p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Ticket size={32} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {filter === 'unread' ? 'Keine ungelesenen Anfragen' : 'Noch keine Support-Anfragen'}
          </h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            Anfragen werden automatisch erstellt wenn Nutzer den Hilfe-Chat verwenden.
          </p>
        </div>
      ) : (
        <div className="card-static overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map(ticket => (
              <Link
                key={ticket.id}
                href={`/admin/users/${ticket.userId}`}
                className="flex items-start gap-4 px-5 py-4 hover:bg-surface-hover transition-colors"
              >
                {/* Unread indicator */}
                <div className="pt-1 shrink-0">
                  {ticket.hasUnread ? (
                    <Circle size={8} fill="var(--ht-primary)" className="text-primary" />
                  ) : (
                    <Circle size={8} className="text-border" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{ticket.userEmail}</span>
                    <span className="text-xs text-muted">·</span>
                    <span className="text-xs text-muted">{formatDate(ticket.updatedAt)}</span>
                  </div>
                  {ticket.lastMessage && (
                    <p className="text-sm text-muted truncate">{ticket.lastMessage}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-1 text-xs text-muted shrink-0">
                  <MessageSquare size={12} />
                  {ticket.messageCount}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active ? 'bg-primary text-white' : 'bg-surface border border-border text-muted hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}
