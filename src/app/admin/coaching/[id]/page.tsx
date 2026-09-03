import { notFound } from 'next/navigation'
import { getEnrollmentAdmin, listPrograms } from '@/lib/coaching/queries'
import { EnrollmentEditor } from './EnrollmentEditor'

export const dynamic = 'force-dynamic'

export default async function AdminEnrollmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [bundle, programs] = await Promise.all([getEnrollmentAdmin(id), listPrograms()])
  if (!bundle) notFound()
  return <EnrollmentEditor bundle={bundle} programs={programs} />
}
