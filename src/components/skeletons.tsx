// Wiederverwendbare Skeleton-Bausteine für loading.tsx Dateien.
// Nutzen dieselben Design-Tokens wie der Rest der App (card-static, surface).

export function SkeletonBar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-foreground/10 dark:bg-foreground/10 ${className}`}
    />
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card-static p-6 ${className}`}>
      <SkeletonBar className="w-12 h-12 rounded-[var(--radius-xl)] mb-4" />
      <SkeletonBar className="h-5 w-3/5 mb-2" />
      <SkeletonBar className="h-3 w-2/5 mb-4" />
      <SkeletonBar className="h-3 w-full mb-2" />
      <SkeletonBar className="h-3 w-4/5 mb-6" />
      <SkeletonBar className="h-4 w-24" />
    </div>
  )
}

export function SkeletonHeader() {
  return (
    <div className="text-center mb-10">
      <SkeletonBar className="h-8 w-64 mx-auto mb-3" />
      <SkeletonBar className="h-4 w-96 max-w-full mx-auto" />
    </div>
  )
}

export function SkeletonGrid({ count = 3, cols = 3 }: { count?: number; cols?: 2 | 3 }) {
  const gridClass = cols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
  return (
    <div className={`grid grid-cols-1 ${gridClass} gap-5`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
