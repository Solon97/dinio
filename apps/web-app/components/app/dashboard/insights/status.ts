import { FinancialStatus } from "@/types/finance";

// Status types for color determination
export type InsightStatus = "positive" | "negative" | "neutral" | "warning";

// Central function to get color based on status
export function getStatusColor(status: InsightStatus): string {
  switch (status) {
    case "positive":
      return "text-emerald-400";
    case "negative":
      return "text-rose-400";
    case "warning":
      return "text-amber-400";
    case "neutral":
    default:
      return "text-amber-400";
  }
}

// Convert FinancialStatus to InsightStatus
export function financialStatusToInsightStatus(
  status: FinancialStatus
): InsightStatus {
  if (status === FinancialStatus.CRITICAL) return "negative";
  if (status === FinancialStatus.WARNING) return "warning";
  return "positive";
}
