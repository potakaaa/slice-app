import { create } from "zustand";

import type { Creditor, UserProfile } from "@/types";
import { generateId } from "@/utils/calculations";

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
  profile: UserProfile;
  creditors: Creditor[];

  updateProfile: (updates: Partial<UserProfile>) => void;

  addCreditor: (
    creditor: Omit<Creditor, "id" | "addedAt" | "priority" | "status" | "notes">
  ) => void;
  resetApp: () => void;
}

export const useAppStore = create<AppStore>()((set) => ({
  profile: DEFAULT_PROFILE,
  creditors: [],

  updateProfile: (updates) =>
    set((s) => ({ profile: { ...s.profile, ...updates } })),

  addCreditor: (data) =>
    set((s) => {
      const newCreditor: Creditor = {
        ...data,
        id: generateId(),
        status: "active",
        notes: "",
        priority: s.creditors.length + 1,
        addedAt: new Date().toISOString(),
      };
      return { creditors: [...s.creditors, newCreditor] };
    }),

  resetApp: () =>
    set({
      profile: DEFAULT_PROFILE,
      creditors: [],
    }),
}));
