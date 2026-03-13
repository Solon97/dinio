"use client";

import { ReactNode } from "react";
import { BudgetProvider } from "@/contexts/BudgetContext";

interface DashboardProviderProps {
  children: ReactNode;
}

export default function DashboardProvider({ children }: DashboardProviderProps) {
  return (
    <BudgetProvider>
      {children}
    </BudgetProvider>
  );
}
