import { createAdminClient } from '@/lib/supabase/admin'
import { NewsletterTable } from './NewsletterTable'

export const dynamic = 'force-dynamic'

type SignupRow = {
  id: string
  email: string
  status: 'pending' | 'invited' | 'registered'
  source: string
  created_at: string
  invited_at: string | null
  registered_at: string | null
}

export default async function AdminNewsletterPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('newsletter_signups')
    .select('id, email, status, source, created_at, invited_at, registered_at')
    .order('created_at', { ascending: false })

  const signups = (data ?? []) as SignupRow[]
  const pendingCount = signups.filter((s) => s.status === 'pending').length
  const invitedCount = signups.filter((s) => s.status === 'invited').length
  const registeredCount = signups.filter((s) => s.status === 'registered').length

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Newsletter-Signups</h1>
        <p className="text-sm text-muted mt-1">
          {signups.length} Einträge · {pendingCount} wartend · {invitedCount} eingeladen · {registeredCount} registriert
        </p>
      </div>
      <NewsletterTable signups={signups} />
    </div>
  )
}
