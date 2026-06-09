import type { SubscriptionTier } from "@/types";

export type BillingPeriod = "monthly" | "yearly";

export const REVENUECAT_PACKAGE_IDS = {
  silver: { monthly: "silver_monthly", yearly: "silver_yearly" },
  gold: { monthly: "gold_monthly", yearly: "gold_yearly" },
  platinum: { monthly: "platinum_monthly", yearly: "platinum_yearly" },
} as const;

export type PaidTier = Exclude<SubscriptionTier, "free">;

const tierRank: Record<SubscriptionTier, number> = {
  free: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
};

export function packageRefForIdentifier(
  identifier: string,
): { tier: PaidTier; period: BillingPeriod } | null {
  for (const [tier, periods] of Object.entries(REVENUECAT_PACKAGE_IDS)) {
    for (const [period, value] of Object.entries(periods)) {
      if (value === identifier) {
        return { tier: tier as PaidTier, period: period as BillingPeriod };
      }
    }
  }
  return null;
}

export function tierForPackageIdentifier(identifier: string): PaidTier | null {
  return packageRefForIdentifier(identifier)?.tier ?? null;
}

export function highestEntitlementTier(identifiers: string[]): SubscriptionTier {
  return identifiers.reduce<SubscriptionTier>((highest, identifier) => {
    const normalized = identifier.toLowerCase();
    const candidate: SubscriptionTier = normalized.includes("platinum")
      ? "platinum"
      : normalized.includes("gold")
        ? "gold"
        : normalized.includes("silver")
          ? "silver"
          : "free";
    return tierRank[candidate] > tierRank[highest] ? candidate : highest;
  }, "free");
}
