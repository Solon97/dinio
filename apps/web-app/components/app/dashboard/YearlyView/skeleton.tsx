import { SkeletonBase, SkeletonChart } from "@/components/shared/skeletons";

/**
 * Skeleton component for YearlyView loading state
 * Matches layout: Yearly chart + 3 summary cards
 */
export function YearlyViewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6">
      {/* Yearly Chart */}
      <SkeletonChart height="500px" variant="bar" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm min-h-[100px]">
          <SkeletonBase width="60%" height="0.875rem" className="mb-2" />
          <SkeletonBase width="70%" height="2rem" />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm min-h-[100px]">
          <SkeletonBase width="60%" height="0.875rem" className="mb-2" />
          <SkeletonBase width="70%" height="2rem" />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm min-h-[100px]">
          <SkeletonBase width="60%" height="0.875rem" className="mb-2" />
          <SkeletonBase width="70%" height="2rem" />
        </div>
      </div>
    </div>
  );
}
