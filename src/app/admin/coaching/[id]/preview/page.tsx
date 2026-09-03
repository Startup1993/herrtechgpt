import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getEnrollmentAdmin } from '@/lib/coaching/queries'
import { getAppSettings } from '@/lib/app-settings'
import { CoachingDashboard } from '@/app/dashboard/coaching/CoachingDashboard'

export const dynamic = 'force-dynamic'

/** Coach sieht die Seite genau so wie der Kunde, nur ohne Schreibaktionen. */
export default async function EnrollmentPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [bundle, settings] = await Promise.all([getEnrollmentAdmin(id), getAppSettings()])
  if (!bundle) notFound()

  const clientBundle = {
    ...bundle,
    tasks: bundle.tasks.filter((t) => t.assignee === 'client'),
    materials: bundle.materials.filter((m) => m.visibility === 'client'),
    events: bundle.events.filter((e) => e.client_visible),
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b border-border bg-surface px-5 py-2 flex items-center gap-3 text-sm">
        <Link href={`/admin/coaching/${id}`} className="inline-flex items-center gap-1 text-muted hover:text-foreground"><ChevronLeft size={15} /> Zurück zum Editor</Link>
        <span className="text-muted">·</span>
        <span className="text-foreground font-medium">Kundenansicht von {bundle.enrollment.client_name}</span>
      </div>
      <div className="flex-1 min-h-0">
        <CoachingDashboard
          bundle={clientBundle}
          firstName={bundle.enrollment.client_name.split(' ')[0]}
          communityUrl={bundle.enrollment.community_url ?? settings.communityUrl}
          preview
        />
      </div>
    </div>
  )
}
