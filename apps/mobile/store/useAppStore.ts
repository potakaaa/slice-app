import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Creditor, UserProfile } from "@/types";

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  email: "",
  creditScore: 0,
  primaryGoal: "settle",
  defaultSettlementPercentage: 0.5,
  defaultMonthlySavings: 500,
  tier: "free",
  onboardingComplete: false,
};

interface AppStore {
  hasHydrated: boolean;
  hasSeenOnboarding: boolean;
  onboardingReadyForAuth: boolean;
  awaitingEmailConfirmation: boolean;
  profile: UserProfile;
  creditors: Creditor[];

  setHasHydrated: (hasHydrated: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setCreditors: (creditors: Creditor[]) => void;
  markOnboardingSeen: () => void;
  markOnboardingReady: () => void;
  setAwaitingEmailConfirmation: (awaiting: boolean) => void;
  clearDraft: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      hasHydrated: false,
      hasSeenOnboarding: false,
      onboardingReadyForAuth: false,
      awaitingEmailConfirmation: false,
      profile: DEFAULT_PROFILE,
      creditors: [],

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      updateProfile: (updates) =>
        set((state) => ({ profile: { ...state.profile, ...updates } })),
      setCreditors: (creditors) => set({ creditors }),
      markOnboardingSeen: () => set({ hasSeenOnboarding: true }),
      markOnboardingReady: () =>
        set({
          hasSeenOnboarding: true,
          onboardingReadyForAuth: true,
          awaitingEmailConfirmation: false,
        }),
      setAwaitingEmailConfirmation: (awaitingEmailConfirmation) =>
        set({ awaitingEmailConfirmation }),
      clearDraft: () =>
        set({
          profile: DEFAULT_PROFILE,
          creditors: [],
          hasSeenOnboarding: true,
          onboardingReadyForAuth: false,
          awaitingEmailConfirmation: false,
        }),
    }),
    {
      name: "slice-onboarding-draft",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
        onboardingReadyForAuth: state.onboardingReadyForAuth,
        awaitingEmailConfirmation: state.awaitingEmailConfirmation,
        profile: state.profile,
        creditors: state.creditors,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
