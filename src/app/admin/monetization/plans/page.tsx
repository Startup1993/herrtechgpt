import { createClient } from '@/lib/supabase/server'
import type { Plan } from '@/lib/types'
import PlansManager from './PlansManager'

export const dynamic = 'force-dynamic'

export default async function AdminPlansPage() {
  const supabase = await createClient()
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Abo-Pläne (S / M / L)</h1>
        <p className="text-muted max-w-2xl">
          Hier konfigurierst du die drei Abo-Stufen. Preise werden in Cent gespeichert
          (z.B. 4900 = 49,00 €). Community-Preis 0 = Gratis-Zugang für KI Marketing Club.
        </p>
        <div className="mt-3 inline-flex items-start gap-2 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs rounded-lg px-3 py-2 border border-amber-500/30 max-w-2xl">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>
            Ablefy-Produkt-IDs müssen nach dem Anlegen in Ablefy hier eingetragen werden —
            sonst kann der Checkout nicht starten.
          </span>
        </div>
      </div>

      <PlansManager initialPlans={(plans as Plan[]) ?? []} />
    </div>
  )
}
