import type { ContactOutcome, Creditor } from "@/types";

export const SIMPLE_PROGRAM_SETTLEMENT_RATE = 0.5;

export function calcSettledAmount(
  balance: number,
  settlementPercentage: number
): number {
  return balance * settlementPercentage;
}

export function calcProgramLength(
  settledAmount: number,
  monthlySavings: number
): number {
  if (monthlySavings <= 0) return 0;
  return Math.ceil(settledAmount / monthlySavings);
}

export function calcSimpleProgramSettlementAmount(totalDebt: number): number {
  return totalDebt * SIMPLE_PROGRAM_SETTLEMENT_RATE;
}

export function buildSimpleDebtProgram(totalDebt: number, monthlySavings: number) {
  const estimatedSettlementAmount = calcSimpleProgramSettlementAmount(totalDebt);
  const programLengthMonths = calcProgramLength(estimatedSettlementAmount, monthlySavings);

  return {
    totalDebt,
    estimatedSettlementAmount,
    monthlySavingsAmount: monthlySavings,
    programLengthMonths,
    settlementRate: SIMPLE_PROGRAM_SETTLEMENT_RATE,
  };
}

export function calcTargetDate(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * A month count as a human plan, not a raw number: "under a month", "8 mo",
 * "3 yr 4 mo". Shared so onboarding, the finale, and the dashboard all read the
 * same program length the same way.
 */
export function formatProgramLength(months: number): string {
  if (months < 1) return "under a month";
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years} yr` : `${years} yr ${rem} mo`;
}

/**
 * Today + N months as a friendly full date, e.g. "November 2029", so a
 * first-timer reads a real "debt-free by" calendar moment rather than a raw
 * month count.
 */
export function calcDebtFreeDate(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + Math.max(0, months));
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export type MoneyInputValue = {
  formatted: string;
  value: number;
};

export function parseMoneyInput(input: string): number {
  // Coerce defensively: persisted/migrated state can hand us undefined/null or a
  // number, and a hard `.replace` crash here takes down the whole tree.
  const digits = String(input ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function formatMoneyInput(input: string | number): string {
  const value =
    typeof input === "number" ? Math.max(0, Math.trunc(input)) : parseMoneyInput(input);
  return value > 0 ? value.toLocaleString("en-US") : "";
}

/**
 * Progressive US phone mask: formats digits as the user types into
 * `123-456-7890`. Non-digits are stripped and input is capped at 10 digits so
 * the field never overflows the mask.
 */
export function formatPhoneInput(input: string): string {
  const digits = String(input ?? "").replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function normalizeMoneyInput(input: string): MoneyInputValue {
  const value = parseMoneyInput(input);
  return {
    formatted: value > 0 ? value.toLocaleString("en-US") : "",
    value,
  };
}

export function formatPct(decimal: number): string {
  return `${Math.round(decimal * 100)}%`;
}

export function getTotalDebt(creditors: Creditor[]): number {
  return creditors.reduce((sum, c) => sum + c.balance, 0);
}

export function getTotalSettlementTarget(creditors: Creditor[]): number {
  return creditors.reduce(
    (sum, c) => sum + calcSettledAmount(c.balance, c.settlementPercentage),
    0
  );
}

export function getTotalMonthlySavings(creditors: Creditor[]): number {
  return creditors.reduce((sum, c) => sum + c.monthlySavings, 0);
}

export function getMaxProgramLength(creditors: Creditor[]): number {
  if (creditors.length === 0) return 0;
  return Math.max(
    ...creditors.map((c) =>
      calcProgramLength(
        calcSettledAmount(c.balance, c.settlementPercentage),
        c.monthlySavings
      )
    )
  );
}

/**
 * Months to fund this creditor's settlement target at its monthly savings.
 * No monthly savings means the goal is never reached on its own, so it
 * sorts last (Infinity) rather than masquerading as an instant 0-month win.
 */
function monthsToSettle(c: Creditor): number {
  if (c.monthlySavings <= 0) return Infinity;
  return calcProgramLength(calcSettledAmount(c.balance, c.settlementPercentage), c.monthlySavings);
}

/**
 * Ordering for every creditor list (snowball timeline, creditors tab, program,
 * dashboard priority). Soonest-to-settle first so the user always sees the
 * nearest win at the top; balance breaks ties so equal-timeline creditors fall
 * back to the classic smallest-first snowball.
 */
export function getSortedBySnowball(creditors: Creditor[]): Creditor[] {
  return [...creditors].sort((a, b) => {
    const ma = monthsToSettle(a);
    const mb = monthsToSettle(b);
    // Guard the subtraction: two un-fundable creditors are both Infinity, and
    // Infinity - Infinity is NaN, which corrupts the sort. Only diff when they
    // actually differ; equal timelines fall through to the balance tiebreak.
    if (ma !== mb) return ma - mb;
    return a.balance - b.balance;
  });
}

export function getAISuggestedOffer(balance: number): number {
  if (balance < 3000) return 0.45;
  if (balance < 8000) return 0.38;
  if (balance < 15000) return 0.33;
  return 0.3;
}

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// ---------------------------------------------------------------------------
// Settlement-readiness engine
//
// Answers the core SLICE question: "Am I ready to make my first settlement
// offer, and if not, when?" Readiness is measured against ONE creditor — the
// first/priority creditor you would approach (smallest active balance) — not
// the whole portfolio. All functions are pure and UI-free.
// ---------------------------------------------------------------------------

const DAYS_PER_MONTH = 30.44;
const WEEKS_PER_MONTH = 4.33;
/** Days-until-ready at or below this reads as "Almost ready" in the UI. */
const ALMOST_READY_DAYS = 14;

export type ReadinessStatus =
  | "empty" // no creditor to plan against yet
  | "ready" // enough saved to make the first offer now
  | "needs_input" // not ready and no monthly set-aside provided
  | "almost" // ready within ALMOST_READY_DAYS
  | "on_track"; // ready, but further out

export interface SettlementReadiness {
  status: ReadinessStatus;
  priorityCreditor: Creditor | null;
  firstOfferTarget: number;
  currentSaved: number;
  remainingNeeded: number;
  monthlySetAside: number;
  dailySetAside: number;
  weeklySetAside: number;
  /** 0 = ready now, null = can't project (no monthly set-aside). */
  daysUntilReady: number | null;
  /** Formatted estimate like "Jul 26", or null when unprojectable. */
  readyDate: string | null;
  /** Saved-vs-target ratio, clamped 0..1. */
  progress: number;
  isReadyNow: boolean;
  needsMonthlySetAside: boolean;
}

export interface NextBestMove {
  label: string;
  actionLabel: string;
  route: string;
}

/**
 * The creditor to approach first: smallest-balance active creditor (snowball).
 * Falls back to the smallest creditor that is not settled/closed.
 */
export function getPriorityCreditor(creditors: Creditor[]): Creditor | null {
  if (creditors.length === 0) return null;
  const sorted = getSortedBySnowball(creditors);
  const active = sorted.find((c) => c.status === "active");
  if (active) return active;
  const open = sorted.find((c) => c.status !== "settled" && c.status !== "closed");
  return open ?? null;
}

/** Today + `days`, formatted as a short estimate date (e.g. "Jul 26"). */
export function calcReadyDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + Math.max(0, days));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Human-friendly settlement timeline expressed in months (rolling up to years).
 * Settlement funds take months-to-years to build, so a raw day count ("547 days")
 * is hard to grasp — months read as a plan, not a countdown.
 * e.g. "under a month", "5 months", "1 yr 2 mo".
 */
export function formatReadyTimeline(days: number): string {
  const totalMonths = Math.round(Math.max(0, days) / DAYS_PER_MONTH);
  if (totalMonths < 1) return "under a month";
  if (totalMonths < 12) return `${totalMonths} month${totalMonths === 1 ? "" : "s"}`;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return months === 0 ? `${years} yr` : `${years} yr ${months} mo`;
}

export function calcSettlementReadiness(
  creditors: Creditor[],
  currentSavedCash: number,
  monthlySetAside: number,
  opts: { emergencyBuffer?: number; estimatedFees?: number } = {}
): SettlementReadiness {
  const emergencyBuffer = Math.max(0, opts.emergencyBuffer ?? 0);
  const estimatedFees = Math.max(0, opts.estimatedFees ?? 0);
  const currentSaved = Math.max(0, currentSavedCash || 0);
  const monthly = Math.max(0, monthlySetAside || 0);
  const dailySetAside = monthly / DAYS_PER_MONTH;
  const weeklySetAside = monthly / WEEKS_PER_MONTH;

  const priorityCreditor = getPriorityCreditor(creditors);

  if (!priorityCreditor) {
    return {
      status: "empty",
      priorityCreditor: null,
      firstOfferTarget: 0,
      currentSaved,
      remainingNeeded: 0,
      monthlySetAside: monthly,
      dailySetAside,
      weeklySetAside,
      daysUntilReady: null,
      readyDate: null,
      progress: 0,
      isReadyNow: false,
      needsMonthlySetAside: false,
    };
  }

  const firstOfferTarget =
    calcSettledAmount(priorityCreditor.balance, priorityCreditor.settlementPercentage) +
    estimatedFees +
    emergencyBuffer;
  const remainingNeeded = Math.max(0, firstOfferTarget - currentSaved);
  const isReadyNow = remainingNeeded <= 0;
  const progress =
    firstOfferTarget > 0 ? Math.min(1, Math.max(0, currentSaved / firstOfferTarget)) : 1;

  let daysUntilReady: number | null;
  if (isReadyNow) daysUntilReady = 0;
  else if (dailySetAside > 0) daysUntilReady = Math.ceil(remainingNeeded / dailySetAside);
  else daysUntilReady = null;

  const needsMonthlySetAside = !isReadyNow && monthly <= 0;

  let status: ReadinessStatus;
  if (isReadyNow) status = "ready";
  else if (needsMonthlySetAside) status = "needs_input";
  else if (daysUntilReady !== null && daysUntilReady <= ALMOST_READY_DAYS) status = "almost";
  else status = "on_track";

  const readyDate =
    daysUntilReady !== null ? calcReadyDate(daysUntilReady) : null;

  return {
    status,
    priorityCreditor,
    firstOfferTarget,
    currentSaved,
    remainingNeeded,
    monthlySetAside: monthly,
    dailySetAside,
    weeklySetAside,
    daysUntilReady,
    readyDate,
    progress,
    isReadyNow,
    needsMonthlySetAside,
  };
}

// ---------------------------------------------------------------------------
// Creditor contact logs (Phase 2)
// ---------------------------------------------------------------------------

export const OUTCOME_LABELS: Record<ContactOutcome, string> = {
  left_message: "Left a message",
  callback_requested: "Requested a callback",
  counter_offered: "They counter-offered",
  offer_accepted: "Offer accepted",
  offer_rejected: "Offer rejected",
  no_answer: "No answer",
  other: "Other",
};

export type FollowUpOption = "none" | "1w" | "2w" | "1m";

/** Quick-chip follow-up choice → an ISO date string (yyyy-mm-dd), or null. */
export function getFollowUpDateISO(option: FollowUpOption): string | null {
  if (option === "none") return null;
  const date = new Date();
  if (option === "1w") date.setDate(date.getDate() + 7);
  else if (option === "2w") date.setDate(date.getDate() + 14);
  else if (option === "1m") date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

/** An accepted offer means the creditor is settled. */
export function outcomeMarksSettled(outcome: ContactOutcome): boolean {
  return outcome === "offer_accepted";
}

/** The single "next best move" suggestion, reused by home + onboarding. */
export function getNextBestMove(readiness: SettlementReadiness): NextBestMove {
  const c = readiness.priorityCreditor;
  switch (readiness.status) {
    case "empty":
      return {
        label: "Add one creditor to see your first settlement plan.",
        actionLabel: "Add creditor",
        route: "/creditor/add",
      };
    case "needs_input":
      return {
        label: "Tell us how much you can save each month.",
        actionLabel: "Set savings",
        route: "/what-if",
      };
    case "ready":
      return {
        label: c ? `Generate your ${c.name} script.` : "Generate your first call script.",
        actionLabel: "Generate script",
        route: c ? `/ai/script/${c.id}` : "/what-if",
      };
    default:
      return {
        label: "Try the what-if simulator to move faster.",
        actionLabel: "What if?",
        route: "/what-if",
      };
  }
}
