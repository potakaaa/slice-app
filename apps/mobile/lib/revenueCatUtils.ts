import type { SubscriptionTier } from "@/types";

export const REVENUECAT_PACKAGE_IDS = {
  silver: "silver_monthly",
  gold: "gold_monthly",
  platinum: "platinum_monthly",
} as const;

export type PaidTier = Exclude<SubscriptionTier, "free">;

const tierRank: Record<SubscriptionTier, number> = {
  free: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
};

export function tierForPackageIdentifier(identifier: string): PaidTier | null {
  const entry = Object.entries(REVENUECAT_PACKAGE_IDS).find(([, value]) => value === identifier);
  return (entry?.[0] as PaidTier | undefined) ?? null;
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
