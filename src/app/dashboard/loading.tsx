import { SkeletonBar, SkeletonCard } from '@/components/skeletons'

export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-10">
        <SkeletonBar className="h-8 w-80 max-w-full mb-3" />
        <SkeletonBar className="h-4 w-64 max-w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="card-static p-6">
          <SkeletonBar className="h-5 w-40 mb-3" />
          <SkeletonBar className="h-3 w-full mb-2" />
          <SkeletonBar className="h-3 w-2/3" />
        </div>
        <div className="card-static p-6">
          <SkeletonBar className="h-5 w-40 mb-3" />
          <SkeletonBar className="h-3 w-full mb-2" />
          <SkeletonBar className="h-3 w-2/3" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
