import { driver } from "driver.js";
import type { Driver } from "driver.js";
import { SETUP_STEPS, DAILY_STEPS, MONTHLY_STEPS, YEARLY_STEPS } from "./steps";

type OnboardingPhase = "setup" | "daily" | "monthly" | "yearly";

export interface OnboardingCallbacks {
  onComplete: () => void;
  onSkip: () => void;
}

const DRIVER_BASE_CONFIG = {
  animate: true,
  allowClose: true,
  overlayOpacity: 0.4,
  stagePadding: 10,
  stageRadius: 12,
  popoverClass: "dinio-tour",
  disableActiveInteraction: false,
  smoothScroll: true,
};

let activeDriver: Driver | null = null;
let activePhase: OnboardingPhase | null = null;
let forceComplete = false;

function trackEvent(name: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name));
}

function createDriver(
  phase: OnboardingPhase,
  callbacks: OnboardingCallbacks,
  configOverrides: Partial<typeof DRIVER_BASE_CONFIG> = {},
): Driver {
  let completed = false;

  const steps =
    phase === "setup"
      ? SETUP_STEPS
      : phase === "daily"
        ? DAILY_STEPS
        : phase === "monthly"
          ? MONTHLY_STEPS
          : YEARLY_STEPS;

  const driverInstance = driver({
    ...DRIVER_BASE_CONFIG,
    ...configOverrides,
    steps,
    onNextClick: () => {
      if (!driverInstance.hasNextStep()) {
        completed = true;
      }
      driverInstance.moveNext();
    },
    onDestroyStarted: () => {
      driverInstance.destroy();
      if (completed || forceComplete) {
        trackEvent(`onboarding_${phase}_completed`);
        callbacks.onComplete();
      } else {
        trackEvent(`onboarding_${phase}_skipped`);
        callbacks.onSkip();
      }
      forceComplete = false;
      activeDriver = null;
      activePhase = null;
    },
  });

  return driverInstance;
}

export function getActiveDriver(): Driver | null {
  return activeDriver;
}

export function getActivePhase(): OnboardingPhase | null {
  return activePhase;
}

export function destroyActiveTour(): void {
  if (activeDriver) {
    activeDriver.destroy();
    activeDriver = null;
    activePhase = null;
  }
}

export function completeActiveTour(): void {
  forceComplete = true;
  destroyActiveTour();
}

// ONBOARDING TEMPORARILY DISABLED
const ONBOARDING_DISABLED = true;

export function startSetupOnboarding(callbacks: OnboardingCallbacks): void {
  if (ONBOARDING_DISABLED) return;
  if (activeDriver) return;

  activeDriver = createDriver("setup", callbacks, { allowClose: false });
  activePhase = "setup";
  trackEvent("onboarding_setup_started");
  activeDriver.drive();
}

export function startDailyOnboarding(callbacks: OnboardingCallbacks): void {
  if (ONBOARDING_DISABLED) return;
  if (activeDriver) return;

  activeDriver = createDriver("daily", callbacks);
  activePhase = "daily";
  trackEvent("onboarding_daily_started");
  activeDriver.drive();
}

export function startMonthlyOnboarding(callbacks: OnboardingCallbacks): void {
  if (ONBOARDING_DISABLED) return;
  if (activeDriver) return;

  activeDriver = createDriver("monthly", callbacks);
  activePhase = "monthly";
  trackEvent("onboarding_monthly_started");
  activeDriver.drive();
}

export function startYearlyOnboarding(callbacks: OnboardingCallbacks): void {
  if (ONBOARDING_DISABLED) return;
  if (activeDriver) return;

  activeDriver = createDriver("yearly", callbacks);
  activePhase = "yearly";
  trackEvent("onboarding_yearly_started");
  activeDriver.drive();
}
