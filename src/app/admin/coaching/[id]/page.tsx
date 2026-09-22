import { notFound } from 'next/navigation'
import { getEnrollmentAdmin, listPrograms } from '@/lib/coaching/queries'
import { EnrollmentEditor } from './EnrollmentEditor'

export const dynamic = 'force-dynamic'

const TABS = ['lage', 'sessions', 'tasks', 'goals', 'material', 'history', 'stammdaten'] as const
export type EditorTab = (typeof TABS)[number]

export default async function AdminEnrollmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams])
  const [bundle, programs] = await Promise.all([getEnrollmentAdmin(id), listPrograms()])
  if (!bundle) notFound()
  const initialTab: EditorTab = (TABS as readonly string[]).includes(tab ?? '') ? (tab as EditorTab) : 'lage'
  return <EnrollmentEditor bundle={bundle} programs={programs} initialTab={initialTab} />
}
