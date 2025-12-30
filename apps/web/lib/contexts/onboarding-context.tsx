'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type {
  CountryCode,
  OnboardingState,
  OnboardingStep,
} from '~/lib/types';
import { ONBOARDING_STEPS } from '~/lib/types';

const STORAGE_KEY = 'zeitpal-onboarding-state';

interface OnboardingContextValue {
  state: OnboardingState;
  currentStepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
  completedSteps: OnboardingStep[];

  // Navigation
  goToStep: (step: OnboardingStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;

  // Data updates
  updateData: (data: Partial<OnboardingState['data']>) => void;
  markStepCompleted: (step: OnboardingStep) => void;

  // State management
  resetOnboarding: () => void;
  completeOnboarding: () => Promise<void>;
}

const defaultState: OnboardingState = {
  currentStep: 'welcome',
  completedSteps: [],
  data: {
    locale: 'en',
    defaultVacationDays: 30,
    carryoverEnabled: true,
    carryoverMaxDays: 5,
    skipTeam: false,
    skipInvites: false,
    invites: [],
  },
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as OnboardingState;
        setState(parsed);
      }
    } catch {
      // Ignore parse errors, use default state
    }
    setIsHydrated(true);
  }, []);

  // Persist state to localStorage on change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isHydrated]);

  const currentStepIndex = useMemo(
    () => ONBOARDING_STEPS.indexOf(state.currentStep),
    [state.currentStep]
  );

  const totalSteps = ONBOARDING_STEPS.length;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const progress = useMemo(
    () => ((currentStepIndex + 1) / totalSteps) * 100,
    [currentStepIndex, totalSteps]
  );

  const goToStep = useCallback((step: OnboardingStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const goToNextStep = useCallback(() => {
    setState((prev) => {
      const currentIndex = ONBOARDING_STEPS.indexOf(prev.currentStep);
      const nextIndex = Math.min(currentIndex + 1, ONBOARDING_STEPS.length - 1);
      return {
        ...prev,
        currentStep: ONBOARDING_STEPS[nextIndex]!,
        completedSteps: prev.completedSteps.includes(prev.currentStep)
          ? prev.completedSteps
          : [...prev.completedSteps, prev.currentStep],
      };
    });
  }, []);

  const goToPreviousStep = useCallback(() => {
    setState((prev) => {
      const currentIndex = ONBOARDING_STEPS.indexOf(prev.currentStep);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return { ...prev, currentStep: ONBOARDING_STEPS[prevIndex]! };
    });
  }, []);

  const updateData = useCallback((data: Partial<OnboardingState['data']>) => {
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, ...data },
    }));
  }, []);

  const markStepCompleted = useCallback((step: OnboardingStep) => {
    setState((prev) => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step],
    }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const completeOnboarding = useCallback(async () => {
    // Clear the localStorage when onboarding is fully complete
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const completedSteps = state.completedSteps;

  const value = useMemo(
    () => ({
      state,
      currentStepIndex,
      totalSteps,
      isFirstStep,
      isLastStep,
      progress,
      completedSteps,
      goToStep,
      goToNextStep,
      goToPreviousStep,
      updateData,
      markStepCompleted,
      resetOnboarding,
      completeOnboarding,
    }),
    [
      state,
      currentStepIndex,
      totalSteps,
      isFirstStep,
      isLastStep,
      progress,
      completedSteps,
      goToStep,
      goToNextStep,
      goToPreviousStep,
      updateData,
      markStepCompleted,
      resetOnboarding,
      completeOnboarding,
    ]
  );

  // Don't render until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    return null;
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

// Utility hook to get country-specific minimum leave days
export function useMinLeaveDays(countryCode: CountryCode | undefined) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { COUNTRIES } = require('~/lib/types') as typeof import('~/lib/types');
  const country = COUNTRIES.find((c) => c.code === countryCode);
  return country?.minLeaveDays ?? 20;
}
