export type SubscriptionTier = "free" | "silver" | "gold" | "platinum";
export type PrimaryGoal = "settle" | "repair" | "prepare" | "payoff";
export type CreditorStatus = "active" | "negotiating" | "settled" | "closed";
export type ScriptTone = "calm" | "firm" | "hardship" | "direct";
/** First-run guided tutorial lifecycle. `pending` = eligible to be offered. */
export type TutorialStatus = "pending" | "in_progress" | "completed" | "skipped";

export interface UserProfile {
  name: string;
  email: string;
  creditScore: number;
  primaryGoal: PrimaryGoal;
  /** Self-reported total owed across all debts, captured up-front in onboarding
   *  before individual creditors are added. Per-creditor balances remain the
   *  source of truth once entered (see getTotalDebt). */
  estimatedTotalDebt: number;
  defaultSettlementPercentage: number;
  defaultMonthlySavings: number;
  /** Cash already saved toward the first settlement offer (the settlement fund). */
  currentSavedCash: number;
  /** Self-reported total take-home income per month (onboarding budget step). */
  monthlyIncome: number;
  /** Recurring monthly expenses captured in the onboarding budget step. The
   *  surplus (income − expenses) is the room a user realistically has to fund
   *  settlements. */
  monthlyExpenses: BudgetExpense[];
  tier: SubscriptionTier;
  onboardingComplete: boolean;
  /** ISO timestamp the user finished the optional first-run tour (local-first;
   *  best-effort Supabase sync is a deferred follow-up). */
  tutorialCompletedAt?: string | null;
}

export interface BudgetExpense {
  id: string;
  label: string;
  amount: number;
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

export interface DebtProgram {
  id: string;
  totalDebt: number;
  estimatedSettlementAmount: number;
  monthlySavingsAmount: number;
  programLengthMonths: number;
  settlementRate: number;
  disclosureAccepted: boolean;
  disclosureAcceptedAt?: string | null;
}

export interface SavingsTrackerMonth {
  id: string;
  programId: string;
  monthIndex: number;
  monthlyAmount: number;
  status: "pending" | "saved";
  savedAt: string | null;
}

export type ContactOutcome =
  | "left_message"
  | "callback_requested"
  | "counter_offered"
  | "offer_accepted"
  | "offer_rejected"
  | "no_answer"
  | "other";

export interface ContactLog {
  id: string;
  creditorId: string;
  contactDate: string;
  outcome: ContactOutcome;
  amountOffered: number | null;
  followUpDate: string | null;
  notes: string;
}

export interface NegotiationScript {
  id: string;
  creditorId: string;
  tone: ScriptTone;
  sections: Record<string, string>;
  reminders: string[];
  createdAt: string;
}
