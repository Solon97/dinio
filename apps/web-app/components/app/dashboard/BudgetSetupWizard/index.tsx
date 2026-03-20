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
  isSaving?: boolean;
  onSave: (_config: BudgetConfig) => void;
  onCancel: () => void;
}

export default function BudgetSetupWizard(props: BudgetSetupWizardProps) {
  const { isSaving = false, ...providerProps } = props;

  return (
    <BudgetSetupWizardProvider {...providerProps}>
      <WizardModal isSaving={isSaving} />
    </BudgetSetupWizardProvider>
  );
}
