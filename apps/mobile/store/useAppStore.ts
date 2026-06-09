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
  currentSavedCash: 0,
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

  // Delight & review state (Pillar 3: Emotional Connection)
  happyMomentCount: number;
  reviewPromptedVersion: string | null;
  celebratedMilestones: string[];

  setHasHydrated: (hasHydrated: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setCreditors: (creditors: Creditor[]) => void;
  markOnboardingSeen: () => void;
  markOnboardingReady: () => void;
  setAwaitingEmailConfirmation: (awaiting: boolean) => void;
  clearDraft: () => void;

  /** Record an accomplishment that builds goodwill toward a review ask. */
  recordHappyMoment: () => void;
  /** Remember we asked for a review on this app version (prevents re-asking). */
  markReviewPrompted: (version: string) => void;
  /** Mark a one-time milestone celebration as shown; returns false if already shown. */
  markMilestoneCelebrated: (key: string) => boolean;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      hasSeenOnboarding: false,
      onboardingReadyForAuth: false,
      awaitingEmailConfirmation: false,
      profile: DEFAULT_PROFILE,
      creditors: [],
      happyMomentCount: 0,
      reviewPromptedVersion: null,
      celebratedMilestones: [],

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

      recordHappyMoment: () =>
        set((state) => ({ happyMomentCount: state.happyMomentCount + 1 })),
      markReviewPrompted: (version) => set({ reviewPromptedVersion: version }),
      markMilestoneCelebrated: (key) => {
        if (get().celebratedMilestones.includes(key)) return false;
        set((state) => ({
          celebratedMilestones: [...state.celebratedMilestones, key],
        }));
        return true;
      },
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
        happyMomentCount: state.happyMomentCount,
        reviewPromptedVersion: state.reviewPromptedVersion,
        celebratedMilestones: state.celebratedMilestones,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
