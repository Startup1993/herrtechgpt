'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Coins } from 'lucide-react'

interface BalanceResponse {
  monthly: number
  purchased: number
  total: number
  allowance: number
}

export function CreditBadge() {
  const pathname = usePathname()
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/credits/balance', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as BalanceResponse
        if (!cancelled) setBalance(data)
      } catch {
        // still ignore — badge blendet sich einfach aus
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [pathname])

  if (loading || !balance) return null
  // Free-User ohne Wallet-Einträge nicht nerven
  if (balance.total === 0 && balance.allowance === 0) return null

  const formatted = balance.total.toLocaleString('de-DE')

  return (
    <Link
      href="/dashboard/credits"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground bg-surface/80 hover:bg-surface-secondary border border-border backdrop-blur-sm transition-colors shadow-sm"
      title={`${balance.monthly.toLocaleString('de-DE')} monatlich · ${balance.purchased.toLocaleString('de-DE')} gekauft`}
    >
      <Coins size={13} className="text-primary" />
      <span>{formatted}</span>
      <span className="text-muted hidden sm:inline">Credits</span>
    </Link>
  )
}
