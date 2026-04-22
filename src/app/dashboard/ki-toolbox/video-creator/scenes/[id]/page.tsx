import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScenesPlaceholder from './ScenesPlaceholder'

export default async function ScenesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <ScenesPlaceholder projectId={id} />
}
