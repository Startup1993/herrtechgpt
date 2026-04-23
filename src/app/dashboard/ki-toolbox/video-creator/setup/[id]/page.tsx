import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft, Wrench } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function SetupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/dashboard/ki-toolbox/video-creator/scenes/${id}`}
          className="text-muted hover:text-foreground transition-colors"
          aria-label="Zu den Szenen"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Setup</h1>
          <p className="text-xs text-muted font-mono">{id}</p>
        </div>
      </div>

      <div className="card-static p-6">
        <div className="flex gap-3">
          <Wrench size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Setup-Seite folgt in Kürze
            </h3>
            <p className="text-sm text-muted leading-relaxed mb-3">
              Format, Stil und Untertitel-Konfiguration werden hier eingerichtet,
              und das Video wird mit Live-Progress transkribiert und in Szenen
              zerlegt.
            </p>
            <Link
              href={`/dashboard/ki-toolbox/video-creator/scenes/${id}`}
              className="btn-ghost border border-border"
            >
              Zu den Szenen →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
