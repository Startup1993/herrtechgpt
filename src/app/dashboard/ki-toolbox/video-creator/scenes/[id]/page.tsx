import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScenesView from './ScenesView'

export default async function ScenesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <ScenesView projectId={id} />
}
