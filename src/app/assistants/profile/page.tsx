import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile-form'
import type { Profile } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="border-b border-border px-8 py-5 bg-surface">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧠</span>
          <div>
            <h1 className="text-xl font-bold text-foreground">Meine Wissensbasis</h1>
            <p className="text-sm text-muted mt-0.5">
              Hinterlegen Sie Informationen über sich — die KI nutzt diese für bessere Ergebnisse.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-8 py-6 max-w-2xl">
        <ProfileForm profile={profile as Profile} />
      </div>
    </div>
  )
}
