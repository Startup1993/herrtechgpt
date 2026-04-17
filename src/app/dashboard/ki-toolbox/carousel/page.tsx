import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CarouselWorkflow from './CarouselWorkflow'

export default async function CarouselPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <CarouselWorkflow />
}
