import { useBudgetSetupWizard } from "../Context";
import { Step1 } from "./steps/step1";
import { Step2 } from "./steps/step2";
import { Step3 } from "./steps/step3";

export function BudgetSetupWizardBody() {
  const { step } = useBudgetSetupWizard();
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-slate-50/30">
      {/* STEP 1: INCOME */}
      {step === 1 && <Step1 />}

      {/* STEP 2: CREDIT CARDS + EXPENSES */}
      {step === 2 && <Step2 />}

      {/* STEP 3: ALLOCATION */}
      {step === 3 && <Step3 />}
    </div>
  );
}
