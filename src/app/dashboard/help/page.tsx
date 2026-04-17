'use client'

import { MessageCircleQuestion, Send } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Hilfe & Kontakt
        </h1>
        <p className="text-muted text-sm sm:text-base">
          Frag unseren KI-Assistenten oder kontaktiere das Support-Team.
        </p>
      </div>

      <div className="card-static p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <MessageCircleQuestion size={32} className="text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Support-Chat kommt bald
        </h2>
        <p className="text-sm text-muted max-w-md mx-auto mb-6">
          Hier entsteht ein KI-gestützter Hilfe-Chat mit Zugriff auf die gesamte Wissensbasis.
          Bei Bedarf wirst du direkt an einen echten Ansprechpartner weitergeleitet.
        </p>
        <a
          href="mailto:support@herr.tech"
          className="btn-primary inline-flex"
        >
          <Send size={16} />
          E-Mail an Support
        </a>
      </div>
    </div>
  )
}
