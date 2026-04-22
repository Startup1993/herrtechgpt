import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScenesPlaceholder from '../../scenes/[id]/ScenesPlaceholder'

export default async function SetupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Setup-UI folgt in nächstem Release. Platzhalter identisch zu Scenes.
  return <ScenesPlaceholder projectId={id} />
}
