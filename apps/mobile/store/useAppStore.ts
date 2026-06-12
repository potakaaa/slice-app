import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Creditor, TutorialStatus, UserProfile } from "@/types";

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  email: "",
  creditScore: 0,
  primaryGoal: "settle",
  estimatedTotalDebt: 0,
  defaultSettlementPercentage: 0.5,
  defaultMonthlySavings: 500,
  currentSavedCash: 0,
  monthlyIncome: 0,
  monthlyExpenses: [],
  tier: "free",
  onboardingComplete: false,
};

interface AppStore {
  hasHydrated: boolean;
  hasSeenOnboarding: boolean;
  onboardingReadyForAuth: boolean;
  /**
   * Auth user id that owns the current onboarding draft (creditors + draft
   * profile + `onboardingReadyForAuth`). The draft is persisted device-wide, so
   * this stamp is what lets the root router tell "this signed-in user's own
   * in-progress onboarding" apart from a stale draft left by a previous /
   * abandoned account on the same device. `null` => unowned (treat as foreign).
   */
  draftOwnerId: string | null;
  awaitingEmailConfirmation: boolean;
  profile: UserProfile;
  creditors: Creditor[];

  /**
   * First-run optional tutorial status. `pending` => eligible to be offered the
   * opt-in welcome sheet; `in_progress` => the guided tour is running;
   * `completed`/`skipped` => never auto-offered again (still replayable).
   */
  tutorialStatus: TutorialStatus;

  /**
   * Post-onboarding "open a dedicated settlement savings account" task. Stays
   * `false` until the user confirms they've opened the account, so the dashboard
   * prompt re-appears every launch and the first-run tour is held back until
   * this is done. `false` is the correct default for existing installs too —
   * everyone should be nudged to open the account — so no migration is needed.
   */
  savingsAccountCreated: boolean;

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
  markOnboardingReady: (ownerId: string) => void;
  setAwaitingEmailConfirmation: (awaiting: boolean) => void;
  clearDraft: () => void;

  /** Mark the dedicated settlement savings account as opened (dismisses the
   *  dashboard prompt and unblocks the first-run tour). */
  markSavingsAccountCreated: () => void;

  /** Set the first-run tutorial status (e.g. `completed` / `skipped`). */
  setTutorialStatus: (status: TutorialStatus) => void;
  /** Begin the guided tour — used by the opt-in sheet and the "Replay" entry. */
  startTour: () => void;

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
      draftOwnerId: null,
      awaitingEmailConfirmation: false,
      profile: DEFAULT_PROFILE,
      creditors: [],
      tutorialStatus: "pending",
      savingsAccountCreated: false,
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
      markOnboardingReady: (ownerId) =>
        set({
          hasSeenOnboarding: true,
          onboardingReadyForAuth: true,
          awaitingEmailConfirmation: false,
          draftOwnerId: ownerId,
        }),
      setAwaitingEmailConfirmation: (awaitingEmailConfirmation) =>
        set({ awaitingEmailConfirmation }),
      clearDraft: () =>
        set({
          profile: DEFAULT_PROFILE,
          creditors: [],
          hasSeenOnboarding: true,
          onboardingReadyForAuth: false,
          draftOwnerId: null,
          awaitingEmailConfirmation: false,
        }),

      markSavingsAccountCreated: () => set({ savingsAccountCreated: true }),

      setTutorialStatus: (tutorialStatus) =>
        set((state) => ({
          tutorialStatus,
          profile:
            tutorialStatus === "completed"
              ? { ...state.profile, tutorialCompletedAt: new Date().toISOString() }
              : state.profile,
        })),
      startTour: () => set({ tutorialStatus: "in_progress" }),

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
      version: 5,
      // Existing installs (persisted before the tutorial shipped) have no
      // `tutorialStatus`. Default them to `skipped` so only genuinely-new users
      // — who get `pending` set at onboarding completion — are ever offered it.
      migrate: (persisted: any, version) => {
        if (version < 1 && persisted && persisted.tutorialStatus === undefined) {
          persisted.tutorialStatus = "skipped";
        }
        // v3: onboarding profile gained `estimatedTotalDebt` plus the monthly
        // budget fields (`monthlyIncome`, `monthlyExpenses`). Gated on `< 3`
        // (not `< 2`) so state already bumped to v2 mid-development still gets
        // the budget fields backfilled. Each check is idempotent.
        if (version < 3 && persisted?.profile) {
          if (persisted.profile.estimatedTotalDebt === undefined) {
            persisted.profile.estimatedTotalDebt = 0;
          }
          if (persisted.profile.monthlyIncome === undefined) {
            persisted.profile.monthlyIncome = 0;
          }
          if (persisted.profile.monthlyExpenses === undefined) {
            persisted.profile.monthlyExpenses = [];
          }
        }
        // v4: onboarding drafts are now stamped with the owning auth user id so
        // a stale draft can't route a different account into "Program Ready".
        // Existing in-progress drafts have no owner — default to `null` (unowned)
        // so the root router treats them as foreign and restarts onboarding.
        if (version < 4 && persisted && persisted.draftOwnerId === undefined) {
          persisted.draftOwnerId = null;
        }
        // v5: awaitingEmailConfirmation is session-scoped UI state and must not
        // survive a cold launch (it was wrongly persisted before v5, causing the
        // "Check your email" gate to be the first screen on relaunch). Strip any
        // persisted value so rehydrate falls back to the in-memory default (false).
        if (version < 5 && persisted && persisted.awaitingEmailConfirmation !== undefined) {
          delete persisted.awaitingEmailConfirmation;
        }
        return persisted;
      },
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
        onboardingReadyForAuth: state.onboardingReadyForAuth,
        draftOwnerId: state.draftOwnerId,
        profile: state.profile,
        creditors: state.creditors,
        tutorialStatus: state.tutorialStatus,
        savingsAccountCreated: state.savingsAccountCreated,
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
