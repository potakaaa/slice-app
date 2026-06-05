export type SubscriptionTier = "free" | "silver" | "gold" | "platinum";
export type PrimaryGoal = "settle" | "repair" | "prepare" | "payoff";
export type CreditorStatus = "active" | "negotiating" | "settled" | "closed";
export type ScriptTone = "calm" | "firm" | "hardship" | "direct";

export interface UserProfile {
  name: string;
  email: string;
  creditScore: number;
  primaryGoal: PrimaryGoal;
  defaultSettlementPercentage: number;
  defaultMonthlySavings: number;
  tier: SubscriptionTier;
  onboardingComplete: boolean;
}

export interface Creditor {
  id: string;
  name: string;
  phone: string;
  balance: number;
  settlementPercentage: number;
  monthlySavings: number;
  status: CreditorStatus;
  notes: string;
  priority: number;
  addedAt: string;
}

export interface CreditRepairTask {
  id: string;
  task: string;
  category: string;
  completed: boolean;
}

export interface CoachingBooking {
  id: string;
  topic: string;
  notes: string;
  date?: string;
  status: "pending" | "confirmed" | "completed";
  createdAt: string;
}
