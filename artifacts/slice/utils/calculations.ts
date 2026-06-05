import type { Creditor } from "@/types";

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

export function calcTargetDate(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
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

export function getSortedBySnowball(creditors: Creditor[]): Creditor[] {
  return [...creditors].sort((a, b) => a.balance - b.balance);
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
