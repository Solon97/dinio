"use client";

import { PartialMonthInfo, WizardInitialData } from "@/types/budget";
import { BudgetConfig } from "@/types/finance";
import { BudgetSetupWizardProvider } from "./Context";
import { WizardModal } from "./WizardModal";

interface BudgetSetupWizardProps {
  monthName: string;
  month: number;
  year: number;
  initialData: WizardInitialData;
  isEditing?: boolean;
  isFirstMonth?: boolean;
  isPartialMonth: boolean;
  partialMonthInfo: PartialMonthInfo;
  onSave: (_config: BudgetConfig) => void;
  onCancel: () => void;
}

export default function BudgetSetupWizard(props: BudgetSetupWizardProps) {
  return (
    <BudgetSetupWizardProvider {...props}>
      <WizardModal />
    </BudgetSetupWizardProvider>
  );
}
