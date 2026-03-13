"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  OnboardingState,
  clearAllCache,
  clearCacheForPhase,
  loadFromCache,
  persistToSupabase,
  resetAllInSupabase,
  saveToCache,
  stateFromUserData,
} from "@/libs/onboarding/storage";
import {
  destroyActiveTour,
  startDailyOnboarding,
  startMonthlyOnboarding,
  startYearlyOnboarding,
  startSetupOnboarding,
} from "@/libs/onboarding/onboarding";
import { useUser } from "./UserContext";

interface OnboardingContextValue {
  state: OnboardingState;
  isLoading: boolean;
  startSetupTour: () => void;
  startDailyTour: (onAfterComplete?: () => void) => void;
  startMonthlyTour: (onAfterComplete?: () => void) => void;
  startYearlyTour: () => void;
  completeSetupTour: () => Promise<void>;
  completeDailyTour: () => Promise<void>;
  completeMonthlyTour: () => Promise<void>;
  resetTour: (phase?: keyof OnboardingState) => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: userLoading } = useUser();
  const [state, setState] = useState<OnboardingState>(loadFromCache);
  const [isLoading, setIsLoading] = useState(true);
  const syncedRef = useRef(false);

  // Sync with Supabase once the user is loaded
  useEffect(() => {
    if (userLoading || syncedRef.current) return;

    if (user) {
      const remoteState = stateFromUserData(user);
      setState(remoteState);

      // Update cache to match Supabase truth
      if (remoteState.setupCompleted) saveToCache("setup");
      else clearCacheForPhase("setup");

      if (remoteState.dailyCompleted) saveToCache("daily");
      else clearCacheForPhase("daily");

      if (remoteState.monthlyCompleted) saveToCache("monthly");
      else clearCacheForPhase("monthly");

      if (remoteState.yearlyCompleted) saveToCache("yearly");
      else clearCacheForPhase("yearly");

      syncedRef.current = true;
    }

    setIsLoading(false);
  }, [user, userLoading]);

  const handleComplete = useCallback(
    async (phase: "setup" | "daily" | "monthly" | "yearly") => {
      saveToCache(phase);
      setState((prev) => ({
        ...prev,
        setupCompleted: phase === "setup" ? true : prev.setupCompleted,
        dailyCompleted: phase === "daily" ? true : prev.dailyCompleted,
        monthlyCompleted: phase === "monthly" ? true : prev.monthlyCompleted,
        yearlyCompleted: phase === "yearly" ? true : prev.yearlyCompleted,
      }));
      await persistToSupabase(phase, true);
    },
    [],
  );

  const startSetupTour = useCallback(() => {
    startSetupOnboarding({
      onComplete: () => handleComplete("setup"),
      onSkip: () => handleComplete("setup"),
    });
  }, [handleComplete]);

  const startDailyTour = useCallback(
    (onAfterComplete?: () => void) => {
      startDailyOnboarding({
        onComplete: () => {
          handleComplete("daily").then(() => onAfterComplete?.());
        },
        onSkip: () => handleComplete("daily"),
      });
    },
    [handleComplete],
  );

  const startMonthlyTour = useCallback(
    (onAfterComplete?: () => void) => {
      startMonthlyOnboarding({
        onComplete: () => {
          handleComplete("monthly").then(() => onAfterComplete?.());
        },
        onSkip: () => handleComplete("monthly"),
      });
    },
    [handleComplete],
  );

  const startYearlyTour = useCallback(() => {
    startYearlyOnboarding({
      onComplete: () => handleComplete("yearly"),
      onSkip: () => handleComplete("yearly"),
    });
  }, [handleComplete]);

  const resetTour = useCallback(async (phase?: keyof OnboardingState) => {
    destroyActiveTour();

    if (phase) {
      const phaseKey =
        phase === "setupCompleted"
          ? "setup"
          : phase === "dailyCompleted"
            ? "daily"
            : phase === "monthlyCompleted"
              ? "monthly"
              : "yearly";

      clearCacheForPhase(phaseKey);
      setState((prev) => ({ ...prev, [phase]: false }));
      await persistToSupabase(phaseKey, false);
    } else {
      clearAllCache();
      setState({
        setupCompleted: false,
        dailyCompleted: false,
        monthlyCompleted: false,
        yearlyCompleted: false,
      });
      await resetAllInSupabase();
    }

    syncedRef.current = false;
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        state,
        isLoading,
        startSetupTour,
        startDailyTour,
        startMonthlyTour,
        startYearlyTour,
        completeSetupTour: () => handleComplete("setup"),
        completeDailyTour: () => handleComplete("daily"),
        completeMonthlyTour: () => handleComplete("monthly"),
        resetTour,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
