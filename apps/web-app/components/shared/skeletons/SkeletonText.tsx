import { SkeletonBase } from "./SkeletonBase";

interface SkeletonTextProps {
  width?: string;
  height?: string;
  lines?: number;
  className?: string;
}

/**
 * Skeleton for text elements (titles, labels, paragraphs)
 * Supports single line or multiple lines
 */
export function SkeletonText({
  width = "100%",
  height = "1rem",
  lines = 1,
  className = "",
}: SkeletonTextProps) {
  if (lines === 1) {
    return <SkeletonBase width={width} height={height} className={className} />;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <SkeletonBase
          key={idx}
          width={idx === lines - 1 ? "80%" : "100%"}
          height={height}
        />
      ))}
    </div>
  );
}
