import { SkeletonBar } from '@/components/skeletons'

export default function CoachingHomeLoading() {
  return (
    <div className="p-6 sm:p-8 max-w-7xl space-y-6">
      <div className="flex items-end justify-between">
        <div><SkeletonBar className="h-3 w-40 mb-2" /><SkeletonBar className="h-8 w-32" /></div>
        <SkeletonBar className="h-8 w-64" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card-static p-4"><SkeletonBar className="h-3 w-20 mb-3" /><SkeletonBar className="h-8 w-14 mb-2" /><SkeletonBar className="h-3 w-32" /></div>)}
      </div>
      <div className="card-static p-4"><SkeletonBar className="h-3 w-28 mb-4" /><div className="grid grid-cols-7 gap-2">{Array.from({ length: 7 }).map((_, i) => <SkeletonBar key={i} className="h-24" />)}</div></div>
      <div className="grid gap-4 lg:grid-cols-2"><div className="card-static p-4 h-40" /><div className="card-static p-4 h-40" /></div>
    </div>
  )
}
