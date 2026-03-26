'use client'

import { useState } from 'react'

interface AIGenerateButtonProps {
  field: string
  currentProfile: {
    background: string
    market: string
    target_audience: string
    offer: string
  }
  onGenerated: (text: string) => void
}

export function AIGenerateButton({
  field,
  currentProfile,
  onGenerated,
}: AIGenerateButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, currentProfile }),
      })
      const data = await res.json()
      if (data.text) {
        onGenerated(data.text)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      className="text-xs text-primary hover:text-primary-hover disabled:opacity-40 font-medium transition-colors"
    >
      {loading ? 'Generiere...' : 'Mit KI generieren'}
    </button>
  )
}
