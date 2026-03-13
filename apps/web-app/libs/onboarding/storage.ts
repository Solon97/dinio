import apiClient from "@/libs/api";

export interface OnboardingState {
  setupCompleted: boolean;
  dailyCompleted: boolean;
  monthlyCompleted: boolean;
  yearlyCompleted: boolean;
}

type OnboardingField =
  | "onboarding_setup_completed"
  | "onboarding_daily_completed"
  | "onboarding_monthly_completed"
  | "onboarding_yearly_completed";

const CACHE_KEYS = {
  setup: "dinio_onboarding_setup",
  daily: "dinio_onboarding_daily",
  monthly: "dinio_onboarding_monthly",
  yearly: "dinio_onboarding_yearly",
} as const;

const SUPABASE_FIELD: Record<keyof typeof CACHE_KEYS, OnboardingField> = {
  setup: "onboarding_setup_completed",
  daily: "onboarding_daily_completed",
  monthly: "onboarding_monthly_completed",
  yearly: "onboarding_yearly_completed",
};

type OnboardingPhase = keyof typeof CACHE_KEYS;

export function loadFromCache(): OnboardingState {
  if (typeof window === "undefined") {
    return {
      setupCompleted: false,
      dailyCompleted: false,
      monthlyCompleted: false,
      yearlyCompleted: false,
    };
  }

  return {
    setupCompleted: localStorage.getItem(CACHE_KEYS.setup) === "true",
    dailyCompleted: localStorage.getItem(CACHE_KEYS.daily) === "true",
    monthlyCompleted: localStorage.getItem(CACHE_KEYS.monthly) === "true",
    yearlyCompleted: localStorage.getItem(CACHE_KEYS.yearly) === "true",
  };
}

export function saveToCache(phase: OnboardingPhase): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CACHE_KEYS[phase], "true");
}

export function clearCacheForPhase(phase: OnboardingPhase): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEYS[phase]);
}

export function clearAllCache(): void {
  if (typeof window === "undefined") return;
  Object.values(CACHE_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function stateFromUserData(userData: {
  onboardingSetupCompleted: boolean;
  onboardingDailyCompleted: boolean;
  onboardingMonthlyCompleted: boolean;
  onboardingYearlyCompleted: boolean;
}): OnboardingState {
  return {
    setupCompleted: userData.onboardingSetupCompleted,
    dailyCompleted: userData.onboardingDailyCompleted,
    monthlyCompleted: userData.onboardingMonthlyCompleted,
    yearlyCompleted: userData.onboardingYearlyCompleted,
  };
}

export async function persistToSupabase(
  phase: OnboardingPhase,
  value: boolean,
): Promise<void> {
  const field = SUPABASE_FIELD[phase];
  await apiClient.patch("/user", { [field]: value });
}

export async function resetAllInSupabase(): Promise<void> {
  await apiClient.patch("/user", {
    onboarding_setup_completed: false,
    onboarding_daily_completed: false,
    onboarding_monthly_completed: false,
    onboarding_yearly_completed: false,
  });
}
