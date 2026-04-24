import { SkeletonBar, SkeletonCard } from '@/components/skeletons'

export default function AdminLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8">
        <SkeletonBar className="h-8 w-64 mb-3" />
        <SkeletonBar className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-static p-5">
            <SkeletonBar className="h-3 w-24 mb-3" />
            <SkeletonBar className="h-7 w-20 mb-2" />
            <SkeletonBar className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
