'use client'

import { Settings } from 'lucide-react'

export default function AccountPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Einstellungen
        </h1>
        <p className="text-muted text-sm sm:text-base">
          Verwalte dein Profil, Erscheinungsbild und Accounteinstellungen.
        </p>
      </div>

      <div className="card-static p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Settings size={32} className="text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Account-Verwaltung kommt bald
        </h2>
        <p className="text-sm text-muted max-w-md mx-auto">
          Hier kannst du bald deinen Namen, deine E-Mail, den Lernpfad und das Erscheinungsbild (Light/Dark Mode) verwalten.
        </p>
      </div>
    </div>
  )
}
