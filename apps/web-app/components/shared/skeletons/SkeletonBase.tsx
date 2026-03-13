interface SkeletonBaseProps {
  className?: string;
  width?: string;
  height?: string;
}

/**
 * Base skeleton component with shimmer animation
 * Uses design-system neutral colors for background and shimmer effect
 */
export function SkeletonBase({
  className = "",
  width = "100%",
  height = "1rem",
}: SkeletonBaseProps) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        width,
        height,
        background: `linear-gradient(90deg, 
          #f1f5f9 0%, 
          #e2e8f0 50%, 
          #f1f5f9 100%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 2s ease-in-out infinite",
      }}
      aria-hidden="true"
    />
  );
}
