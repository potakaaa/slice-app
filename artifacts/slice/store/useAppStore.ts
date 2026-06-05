import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  CoachingBooking,
  Creditor,
  CreditRepairTask,
  PrimaryGoal,
  SubscriptionTier,
  UserProfile,
} from "@/types";
import { generateId } from "@/utils/calculations";

const DEFAULT_REPAIR_TASKS: CreditRepairTask[] = [
  {
    id: "t1",
    task: "Request your free credit report from AnnualCreditReport.com",
    category: "Report",
    completed: false,
  },
  {
    id: "t2",
    task: "Review report for errors or inaccurate items",
    category: "Report",
    completed: false,
  },
  {
    id: "t3",
    task: "Dispute any inaccurate items in writing",
    category: "Dispute",
    completed: false,
  },
  {
    id: "t4",
    task: "Get settlement agreement in writing before paying",
    category: "Settlement",
    completed: false,
  },
  {
    id: "t5",
    task: "Ask creditor to mark account as 'Paid in Full' or 'Settled'",
    category: "Settlement",
    completed: false,
  },
  {
    id: "t6",
    task: "Keep copies of all settlement letters and confirmations",
    category: "Documentation",
    completed: false,
  },
  {
    id: "t7",
    task: "Track all calls with date and representative name",
    category: "Documentation",
    completed: false,
  },
  {
    id: "t8",
    task: "Monitor account status after each payment",
    category: "Monitoring",
    completed: false,
  },
  {
    id: "t9",
    task: "Review your credit score monthly",
    category: "Monitoring",
    completed: false,
  },
  {
    id: "t10",
    task: "Set up a dedicated savings account for settlements",
    category: "Planning",
    completed: false,
  },
];

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
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  profile: UserProfile;
  creditors: Creditor[];
  creditRepairTasks: CreditRepairTask[];
  coachingBookings: CoachingBooking[];

  updateProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;

  addCreditor: (
    creditor: Omit<Creditor, "id" | "addedAt" | "priority" | "status" | "notes">
  ) => void;
  updateCreditor: (id: string, updates: Partial<Creditor>) => void;
  deleteCreditor: (id: string) => void;

  toggleRepairTask: (id: string) => void;

  addBooking: (
    booking: Omit<CoachingBooking, "id" | "createdAt" | "status">
  ) => void;

  upgradeTier: (tier: SubscriptionTier) => void;
  resetApp: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      profile: DEFAULT_PROFILE,
      creditors: [],
      creditRepairTasks: DEFAULT_REPAIR_TASKS,
      coachingBookings: [],

      updateProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),

      completeOnboarding: () =>
        set((s) => ({
          profile: { ...s.profile, onboardingComplete: true },
        })),

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

      updateCreditor: (id, updates) =>
        set((s) => ({
          creditors: s.creditors.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCreditor: (id) =>
        set((s) => ({
          creditors: s.creditors.filter((c) => c.id !== id),
        })),

      toggleRepairTask: (id) =>
        set((s) => ({
          creditRepairTasks: s.creditRepairTasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        })),

      addBooking: (data) =>
        set((s) => ({
          coachingBookings: [
            ...s.coachingBookings,
            {
              ...data,
              id: generateId(),
              status: "pending",
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      upgradeTier: (tier) =>
        set((s) => ({ profile: { ...s.profile, tier } })),

      resetApp: () =>
        set({
          profile: DEFAULT_PROFILE,
          creditors: [],
          creditRepairTasks: DEFAULT_REPAIR_TASKS,
          coachingBookings: [],
        }),
    }),
    {
      name: "slice-app-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
