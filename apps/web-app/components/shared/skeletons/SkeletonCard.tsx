import { SkeletonBase } from "./SkeletonBase";

interface SkeletonCardProps {
  height?: string;
  className?: string;
  showHeader?: boolean;
  showSubtext?: boolean;
}

/**
 * Skeleton for card components
 * Matches design-system card style: rounded-2xl, border, padding 24px
 */
export function SkeletonCard({
  height = "200px",
  className = "",
  showHeader = true,
  showSubtext = false,
}: SkeletonCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm ${className}`}
      style={{ height }}
    >
      {showHeader && (
        <div className="space-y-3">
          <SkeletonBase width="40%" height="1.25rem" />
          {showSubtext && <SkeletonBase width="60%" height="0.875rem" />}
        </div>
      )}

      <div className="mt-6 space-y-4">
        <SkeletonBase width="100%" height="3rem" />
        <SkeletonBase width="80%" height="1rem" />
      </div>
    </div>
  );
}
