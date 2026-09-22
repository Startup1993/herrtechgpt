import { SkeletonBar } from '@/components/skeletons'

export default function CoachingCustomerLoading() {
  return (
    <div className="p-6 sm:p-8 max-w-6xl space-y-5">
      <SkeletonBar className="h-4 w-28" />
      <div className="card-static p-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex items-center gap-4"><SkeletonBar className="h-14 w-14 rounded-full" /><div className="flex-1"><SkeletonBar className="h-7 w-56 mb-2" /><SkeletonBar className="h-4 w-80 max-w-full" /></div></div>
        <SkeletonBar className="h-24" />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card-static p-4 h-20" />)}</div>
      <div className="grid gap-4 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card-static p-4 h-56" />)}</div>
    </div>
  )
}
