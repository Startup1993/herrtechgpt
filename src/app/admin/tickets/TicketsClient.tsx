'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Ticket, MessageSquare, Bot, User, CheckCircle2 } from 'lucide-react'

type Mode = 'ai' | 'human'
type Status = 'new' | 'answered' | 'resolved'

interface TicketItem {
  id: string
  userId: string
  userEmail: string
  title: string
  messageCount: number
  lastMessage: string
  lastMessageRole: string | null
  createdAt: string
  updatedAt: string
  mode: Mode
  status: Status
}

type FilterKey = 'all' | 'new' | 'answered' | 'resolved'

const STATUS_LABELS: Record<Status, { label: string; badge: string }> = {
  new:      { label: 'Neu',         badge: 'bg-primary/10 text-primary' },
  answered: { label: 'Beantwortet', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' },
  resolved: { label: 'Erledigt',    badge: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
}

export function TicketsClient({ tickets }: { tickets: TicketItem[] }) {
  const [filter, setFilter] = useState<FilterKey>('all')

  const counts = {
    all: tickets.length,
    new: tickets.filter((t) => t.status === 'new').length,
    answered: tickets.filter((t) => t.status === 'answered').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  }

  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
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
            {tickets.length} Anfragen{counts.new > 0 && ` · ${counts.new} neu`}
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <FilterBtn label={`Alle (${counts.all})`}           active={filter === 'all'}      onClick={() => setFilter('all')} />
          <FilterBtn label={`Neu (${counts.new})`}             active={filter === 'new'}      onClick={() => setFilter('new')} />
          <FilterBtn label={`Beantwortet (${counts.answered})`}active={filter === 'answered'} onClick={() => setFilter('answered')} />
          <FilterBtn label={`Erledigt (${counts.resolved})`}   active={filter === 'resolved'} onClick={() => setFilter('resolved')} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card-static p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Ticket size={32} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {filter === 'all' ? 'Noch keine Support-Anfragen' : `Keine Tickets mit Status "${STATUS_LABELS[filter as Status]?.label}"`}
          </h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            Tickets entstehen wenn Nutzer im Hilfe-Chat auf "Mit dem Team sprechen" klicken.
          </p>
        </div>
      ) : (
        <div className="card-static overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map((ticket) => {
              const statusMeta = STATUS_LABELS[ticket.status]
              const isWaitingForAdmin = ticket.status === 'new' && ticket.mode === 'human'
              return (
                <Link
                  key={ticket.id}
                  href={`/admin/tickets/${ticket.id}`}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-surface-hover transition-colors"
                >
                  {/* Mode-Icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    ticket.mode === 'human'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                      : 'bg-surface-secondary text-muted'
                  }`}>
                    {ticket.mode === 'human' ? <User size={15} /> : <Bot size={15} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{ticket.userEmail}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusMeta.badge}`}>
                        {ticket.status === 'resolved' && <CheckCircle2 size={10} />}
                        {statusMeta.label}
                      </span>
                      {isWaitingForAdmin && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                          wartet auf Antwort
                        </span>
                      )}
                      <span className="text-xs text-muted ml-auto">{formatDate(ticket.updatedAt)}</span>
                    </div>
                    {ticket.lastMessage && (
                      <p className="text-sm text-muted truncate">
                        {ticket.lastMessageRole === 'admin' && <span className="text-amber-600 dark:text-amber-400 font-medium">Du: </span>}
                        {ticket.lastMessage}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted shrink-0 pt-1">
                    <MessageSquare size={12} />
                    {ticket.messageCount}
                  </div>
                </Link>
              )
            })}
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
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
        active ? 'bg-primary text-white' : 'bg-surface border border-border text-muted hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}
