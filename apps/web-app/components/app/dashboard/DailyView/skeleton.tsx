import { SkeletonBase, SkeletonChart } from "@/components/shared/skeletons";

/**
 * Skeleton component for DailyView loading state
 * Matches the exact layout: 3 KPI cards + 2 charts
 */
export function DailyViewSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top Row: 3 KPI Cards */}
      <div className="md:col-span-12 grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-6">
        {/* Current Daily Limit - Gradient card skeleton */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-xl md:rounded-2xl p-4 md:p-5 shadow-lg min-h-[140px] md:min-h-[160px]">
          <SkeletonBase width="60%" height="0.875rem" className="mb-2" />
          <SkeletonBase width="80%" height="2.5rem" className="mb-4" />
          <SkeletonBase width="35%" height="1.5rem" className="rounded-md" />
        </div>

        {/* Spent Today skeleton */}
        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 border border-neutral-100 shadow-sm min-h-[120px] md:min-h-[160px]">
          <div className="flex justify-between items-start gap-2 mb-4">
            <div className="flex-1">
              <SkeletonBase width="70%" height="0.875rem" className="mb-2" />
              <SkeletonBase width="60%" height="2rem" />
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-neutral-100" />
          </div>
          <SkeletonBase width="40%" height="0.75rem" />
        </div>

        {/* Available Balance skeleton */}
        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 border border-neutral-100 shadow-sm min-h-[120px] md:min-h-[160px]">
          <div className="flex justify-between items-start gap-2 mb-4">
            <div className="flex-1">
              <SkeletonBase width="80%" height="0.875rem" className="mb-2" />
              <SkeletonBase width="65%" height="2rem" />
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-neutral-100" />
          </div>
          <div className="w-full bg-neutral-100 h-1.5 md:h-2 rounded-full">
            <div className="bg-neutral-200 h-1.5 md:h-2 rounded-full w-3/4" />
          </div>
        </div>
      </div>

      {/* Center: Projection + Insights */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        <div className="md:col-span-8">
          <SkeletonChart height="400px" variant="line" />
        </div>
        <div className="md:col-span-4">
          <SkeletonChart height="400px" variant="line" />
        </div>
      </div>

      {/* Base: Expense list + Category chart */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        <div className="md:col-span-8 bg-white rounded-2xl border border-neutral-100 p-4 md:p-5 shadow-sm">
          <SkeletonBase width="35%" height="1rem" className="mb-4" />
          <div className="space-y-3">
            <SkeletonBase width="100%" height="3.5rem" className="rounded-xl" />
            <SkeletonBase width="100%" height="3.5rem" className="rounded-xl" />
            <SkeletonBase width="100%" height="3.5rem" className="rounded-xl" />
          </div>
        </div>

        <div className="md:col-span-4">
          <SkeletonChart height="400px" variant="pie" />
        </div>
      </div>
    </div>
  );
}
