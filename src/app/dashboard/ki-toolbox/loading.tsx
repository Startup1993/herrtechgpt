import { SkeletonHeader, SkeletonGrid } from '@/components/skeletons'

export default function KiToolboxLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <SkeletonHeader />
      <SkeletonGrid count={3} cols={3} />
    </div>
  )
}
