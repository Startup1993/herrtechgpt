import { createAdminClient } from '@/lib/supabase/admin'
import { ProductsTable } from './ProductsTable'

export const dynamic = 'force-dynamic'

type ProductRow = {
  stripe_product_id: string
  label: string
  access_days: number
  active: boolean
  notes: string | null
  created_at: string
}

export default async function AdminSkoolProductsPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('skool_stripe_products')
    .select('stripe_product_id, label, access_days, active, notes, created_at')
    .order('created_at', { ascending: false })

  const products = (data ?? []) as ProductRow[]

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Skool Stripe-Products</h1>
        <p className="text-sm text-muted mt-1">
          Whitelist der Stripe-Products, die einen Skool-Zugang (+ gratis Plan S) gewähren.
          Neue Preise / Varianten hier eintragen, sobald sie in Stripe angelegt sind.
        </p>
      </div>
      <ProductsTable products={products} />
    </div>
  )
}
