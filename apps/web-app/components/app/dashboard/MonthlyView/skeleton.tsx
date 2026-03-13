import {
  SkeletonCard,
  SkeletonChart,
  SkeletonList,
} from "@/components/shared/skeletons";

/**
 * Skeleton component for MonthlyView loading state
 * Matches layout: Bloco 1 (chart + insights) + Bloco 2 (fixed expenses + invoices)
 */
export function MonthlyViewSkeleton() {
  return (
    <div className="space-y-8">
      {/* BLOCO 1 — Planejamento */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        <div className="md:col-span-5">
          <SkeletonChart height="350px" variant="pie" />
        </div>
        <div className="md:col-span-7">
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm min-h-[350px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SkeletonCard height="140px" showHeader={false} />
              <SkeletonCard height="140px" showHeader={false} />
              <SkeletonCard height="140px" showHeader={false} />
              <SkeletonCard height="140px" showHeader={false} />
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 2 — Compromissos */}
      <div>
        <div className="h-4 w-40 bg-slate-100 rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <SkeletonList rows={4} showHeader />
          <SkeletonList rows={4} showHeader />
        </div>
      </div>
    </div>
  );
}
