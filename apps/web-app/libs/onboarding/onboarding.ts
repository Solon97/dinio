import { driver } from "driver.js";
import type { Driver } from "driver.js";
import { DAILY_STEPS, MONTHLY_STEPS, YEARLY_STEPS } from "./steps";

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

const MOBILE_BREAKPOINT = 768;
const MOBILE_CONFIG = {
  overlayOpacity: 0.55,
  stagePadding: 16,
  disableActiveInteraction: true,
};
const DESKTOP_START_DELAY_MS = 350;
const MOBILE_START_DELAY_MS = 900;

let activeDriver: Driver | null = null;
let activePhase: OnboardingPhase | null = null;
let forceComplete = false;
let startTimeout: ReturnType<typeof setTimeout> | null = null;

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getStartDelayMs(): number {
  return isMobileViewport() ? MOBILE_START_DELAY_MS : DESKTOP_START_DELAY_MS;
}

function getResponsiveConfig(): Partial<typeof DRIVER_BASE_CONFIG> {
  return isMobileViewport() ? MOBILE_CONFIG : {};
}

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
    phase === "daily"
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
      if (startTimeout) {
        clearTimeout(startTimeout);
        startTimeout = null;
      }

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
  if (startTimeout) {
    clearTimeout(startTimeout);
    startTimeout = null;
  }

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

export function startSetupOnboarding(callbacks: OnboardingCallbacks): void {
  callbacks.onComplete();
}

export function startDailyOnboarding(callbacks: OnboardingCallbacks): void {
  if (activeDriver) return;

  activeDriver = createDriver("daily", callbacks, getResponsiveConfig());
  activePhase = "daily";
  trackEvent("onboarding_daily_started");
  startTimeout = setTimeout(() => {
    activeDriver?.drive();
    startTimeout = null;
  }, getStartDelayMs());
}

export function startMonthlyOnboarding(callbacks: OnboardingCallbacks): void {
  if (activeDriver) return;

  activeDriver = createDriver("monthly", callbacks, getResponsiveConfig());
  activePhase = "monthly";
  trackEvent("onboarding_monthly_started");
  startTimeout = setTimeout(() => {
    activeDriver?.drive();
    startTimeout = null;
  }, getStartDelayMs());
}

export function startYearlyOnboarding(callbacks: OnboardingCallbacks): void {
  if (activeDriver) return;

  activeDriver = createDriver("yearly", callbacks, getResponsiveConfig());
  activePhase = "yearly";
  trackEvent("onboarding_yearly_started");
  startTimeout = setTimeout(() => {
    activeDriver?.drive();
    startTimeout = null;
  }, getStartDelayMs());
}
