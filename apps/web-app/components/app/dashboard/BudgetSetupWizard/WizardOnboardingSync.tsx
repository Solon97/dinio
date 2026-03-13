"use client";

import { useEffect } from "react";
import { useBudgetSetupWizard } from "./Context";
import { getActiveDriver, getActivePhase } from "@/libs/onboarding/onboarding";
import { WIZARD_STEPS_OFFSET } from "@/libs/onboarding/steps";

/**
 * Invisible sync layer: keeps the driver.js setup tour in sync
 * with the wizard's current step as the user navigates naturally.
 * On initial mount it advances the tour from the configure-button step
 * into the wizard. Renders nothing — purely a side-effect component.
 *
 * NOTE: Tour destruction on cancel is handled explicitly by the cancel handler
 * in the dashboard page to avoid React StrictMode double-invoke issues.
 */
export function WizardOnboardingSync(): null {
  const { step } = useBudgetSetupWizard();

  // Sync wizard step → driver step.
  // Uses rAF twice to guarantee the element is fully painted before driver.js
  // attempts to compute its bounding rect and position the highlight.
  useEffect(() => {
    const activeDriver = getActiveDriver();
    const activePhase = getActivePhase();

    if (!activeDriver || activePhase !== "setup") return;

    // Wizard steps are 1-based; driver indexes are offset by WIZARD_STEPS_OFFSET
    const driverStepIndex = step - 1 + WIZARD_STEPS_OFFSET;

    let raf1: number;
    let raf2: number;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const current = getActiveDriver();
        if (current) current.moveTo(driverStepIndex);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [step]);

  return null;
}
