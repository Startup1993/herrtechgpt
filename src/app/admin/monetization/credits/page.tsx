import { createClient } from '@/lib/supabase/server'
import type { CreditPack, FeatureCreditCost } from '@/lib/types'
import CreditsManager from './CreditsManager'

export const dynamic = 'force-dynamic'

export default async function AdminCreditsPage() {
  const supabase = await createClient()

  const [{ data: packs }, { data: costs }] = await Promise.all([
    supabase.from('credit_packs').select('*').order('sort_order', { ascending: true }),
    supabase
      .from('feature_credit_costs')
      .select('*')
      .order('category', { ascending: true })
      .order('label', { ascending: true }),
  ])

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Credits</h1>
        <p className="text-muted max-w-2xl">
          Zwei Dinge konfigurierbar: (1) <strong>Credit-Kosten pro Aktion</strong> — was
          verbraucht ein Chat, ein Carousel, eine Video-Sekunde? (2) <strong>Top-up-Pakete</strong>
          — die Credits, die User nachkaufen können wenn ihr Monatskontingent leer ist.
        </p>
      </div>

      <CreditsManager
        initialPacks={(packs as CreditPack[]) ?? []}
        initialCosts={(costs as FeatureCreditCost[]) ?? []}
      />
    </div>
  )
}
