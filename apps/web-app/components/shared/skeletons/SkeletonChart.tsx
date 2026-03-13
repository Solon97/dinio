import { SkeletonBase } from "./SkeletonBase";

interface SkeletonChartProps {
  height?: string;
  className?: string;
  variant?: "bar" | "pie" | "line";
}

/**
 * Skeleton for chart components (Recharts)
 * Shows placeholder pattern matching chart type
 */
export function SkeletonChart({
  height = "400px",
  className = "",
  variant = "bar",
}: SkeletonChartProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm ${className}`}
      style={{ height }}
    >
      {/* Chart title skeleton */}
      <SkeletonBase width="30%" height="1.25rem" className="mb-6" />

      {/* Chart visualization skeleton */}
      <div
        className="flex items-end justify-around gap-2"
        style={{ height: `calc(${height} - 100px)` }}
      >
        {variant === "bar" && (
          <>
            <SkeletonBase width="12%" height="60%" />
            <SkeletonBase width="12%" height="80%" />
            <SkeletonBase width="12%" height="45%" />
            <SkeletonBase width="12%" height="90%" />
            <SkeletonBase width="12%" height="70%" />
            <SkeletonBase width="12%" height="55%" />
          </>
        )}

        {variant === "pie" && (
          <div className="flex items-center justify-center w-full h-full">
            <div
              className="rounded-full"
              style={{
                width: "200px",
                height: "200px",
                background: `linear-gradient(90deg, 
                  #f1f5f9 0%, 
                  #e2e8f0 50%, 
                  #f1f5f9 100%)`,
                backgroundSize: "200% 100%",
                animation: "shimmer 2s ease-in-out infinite",
              }}
            />
          </div>
        )}

        {variant === "line" && (
          <>
            <SkeletonBase width="8%" height="40%" />
            <SkeletonBase width="8%" height="60%" />
            <SkeletonBase width="8%" height="50%" />
            <SkeletonBase width="8%" height="70%" />
            <SkeletonBase width="8%" height="55%" />
            <SkeletonBase width="8%" height="65%" />
            <SkeletonBase width="8%" height="45%" />
            <SkeletonBase width="8%" height="75%" />
          </>
        )}
      </div>

      {/* Legend skeleton */}
      <div className="flex gap-4 justify-center mt-4">
        <SkeletonBase width="80px" height="1rem" />
        <SkeletonBase width="80px" height="1rem" />
        <SkeletonBase width="80px" height="1rem" />
      </div>
    </div>
  );
}
