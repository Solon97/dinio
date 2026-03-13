import { SkeletonBase } from "./SkeletonBase";

interface SkeletonListProps {
  rows?: number;
  className?: string;
  showHeader?: boolean;
}

/**
 * Skeleton for list/table components
 * Shows rows with multiple columns
 */
export function SkeletonList({
  rows = 5,
  className = "",
  showHeader = true,
}: SkeletonListProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm ${className}`}
    >
      {/* List header */}
      {showHeader && (
        <div className="flex justify-between items-center mb-6">
          <SkeletonBase width="30%" height="1.25rem" />
          <SkeletonBase width="80px" height="2rem" className="rounded-xl" />
        </div>
      )}

      {/* List rows */}
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-4 pb-4 border-b border-neutral-100 last:border-0"
          >
            <div className="flex-1">
              <SkeletonBase width="70%" height="1rem" className="mb-2" />
              <SkeletonBase width="40%" height="0.75rem" />
            </div>
            <SkeletonBase
              width="80px"
              height="1.5rem"
              className="rounded-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
