import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VideoEditorWorkflow from './VideoEditorWorkflow'

export default async function VideoEditorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <VideoEditorWorkflow />
}
