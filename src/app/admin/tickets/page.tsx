'use client'

import { Ticket } from 'lucide-react'

export default function AdminTicketsPage() {
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Support-Tickets</h1>
        <p className="text-sm text-muted">Offene Anfragen und Verlauf.</p>
      </div>

      <div className="card-static p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Ticket size={32} className="text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Ticketsystem kommt bald</h2>
        <p className="text-sm text-muted max-w-md mx-auto">
          Hier siehst du bald alle Support-Anfragen von Nutzern, kannst direkt antworten und den Status verwalten.
        </p>
      </div>
    </div>
  )
}
