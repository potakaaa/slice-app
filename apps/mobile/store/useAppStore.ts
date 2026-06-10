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
  /** Weighted goodwill score — bigger wins add more than routine ones. */
  happyMomentCount: number;
  reviewPromptedVersion: string | null;
  celebratedMilestones: string[];
  /** Last-shown copy variant per milestone key — powers no-repeat rotation. */
  celebrationCopyIndex: Record<string, number>;
  /** First-ever app launch (ms epoch); gates install-age before any ask. */
  firstLaunchAt: number | null;
  /** Distinct app opens; powers the early "2nd/3rd open" launch prompt. */
  sessionCount: number;
  /** Last time ANY review prompt fired (ms epoch); enforces global cooldown. */
  lastPromptAt: number | null;
  /** Last negative signal (crash/failed payment/support); suppresses asks. */
  lastNegativeSignalAt: number | null;

  setHasHydrated: (hasHydrated: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setCreditors: (creditors: Creditor[]) => void;
  markOnboardingSeen: () => void;
  markOnboardingReady: () => void;
  setAwaitingEmailConfirmation: (awaiting: boolean) => void;
  clearDraft: () => void;

  /**
   * Record an accomplishment that builds goodwill toward a review ask.
   * Weight reflects emotional magnitude (routine settle = 1, debt-free = 3).
   */
  recordHappyMoment: (weight?: number) => void;
  /** Record an app open; stamps first-launch on the very first call. */
  recordSession: () => void;
  /** Stamp a negative experience so we don't ask for a review right after. */
  recordNegativeSignal: () => void;
  /** Remember we asked for a review on this app version (prevents re-asking). */
  markReviewPrompted: (version: string) => void;
  /** Mark a one-time milestone celebration as shown; returns false if already shown. */
  markMilestoneCelebrated: (key: string) => boolean;
  /** Advance (and persist) the copy-rotation index for a milestone key. */
  setCelebrationCopyIndex: (key: string, index: number) => void;
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
      celebrationCopyIndex: {},
      firstLaunchAt: null,
      sessionCount: 0,
      lastPromptAt: null,
      lastNegativeSignalAt: null,

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

      recordHappyMoment: (weight = 1) =>
        set((state) => ({
          happyMomentCount: state.happyMomentCount + Math.max(1, weight),
        })),
      recordSession: () =>
        set((state) => ({
          firstLaunchAt: state.firstLaunchAt ?? Date.now(),
          sessionCount: state.sessionCount + 1,
        })),
      recordNegativeSignal: () => set({ lastNegativeSignalAt: Date.now() }),
      markReviewPrompted: (version) =>
        set({ reviewPromptedVersion: version, lastPromptAt: Date.now() }),
      markMilestoneCelebrated: (key) => {
        if (get().celebratedMilestones.includes(key)) return false;
        set((state) => ({
          celebratedMilestones: [...state.celebratedMilestones, key],
        }));
        return true;
      },
      setCelebrationCopyIndex: (key, index) =>
        set((state) => ({
          celebrationCopyIndex: { ...state.celebrationCopyIndex, [key]: index },
        })),
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
        celebrationCopyIndex: state.celebrationCopyIndex,
        firstLaunchAt: state.firstLaunchAt,
        sessionCount: state.sessionCount,
        lastPromptAt: state.lastPromptAt,
        lastNegativeSignalAt: state.lastNegativeSignalAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
