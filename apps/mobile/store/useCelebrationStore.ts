import { create } from "zustand";

import type { CelebrationTier, CelebrationVoice } from "@/lib/celebrationCopy";

/**
 * Transient celebration state (NOT persisted).
 *
 * A single root-mounted `CelebrationHost` renders whatever is `active`, so a
 * celebration survives navigation (e.g. add-to-fund taps "Add" then pops back,
 * onboarding auto-advances) and the "one celebration per beat / highest tier
 * wins" rule lives in exactly one place.
 */

const TIER_RANK: Record<CelebrationTier, number> = {
  micro: 0,
  full: 1,
  hero: 2,
};

export interface ActiveCelebration {
  id: number;
  tier: CelebrationTier;
  voice: CelebrationVoice;
  title: string;
  message: string;
}

interface CelebrationStore {
  active: ActiveCelebration | null;
  /**
   * Show a celebration. If one is already on screen, the higher tier wins so a
   * routine toast can never stomp a hero moment (and vice-versa upgrades it).
   */
  show: (celebration: Omit<ActiveCelebration, "id">) => void;
  dismiss: () => void;
}

let nextId = 1;

export const useCelebrationStore = create<CelebrationStore>((set, get) => ({
  active: null,
  show: (celebration) => {
    const current = get().active;
    if (current && TIER_RANK[current.tier] >= TIER_RANK[celebration.tier]) {
      return; // keep the equal-or-higher tier already showing
    }
    set({ active: { ...celebration, id: nextId++ } });
  },
  dismiss: () => set({ active: null }),
}));
