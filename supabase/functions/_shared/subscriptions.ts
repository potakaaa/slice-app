import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { HttpError } from "./errors.ts";

export type Tier = "free" | "silver" | "gold" | "platinum";

const rank: Record<Tier, number> = { free: 0, silver: 1, gold: 2, platinum: 3 };

export function hasTier(current: Tier, required: Tier): boolean {
  return rank[current] >= rank[required];
}

// Keep in sync with AI_DAILY_LIMITS in apps/mobile/lib/tierBenefits.ts (client mirror).
export function aiDailyLimit(tier: Tier): number {
  if (tier === "silver") return 30;
  if (tier === "gold") return 100;
  if (tier === "platinum") return 250;
  return 0;
}

export function tierFromRevenueCat(value?: string | null): Tier {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("platinum")) return "platinum";
  if (normalized.includes("gold")) return "gold";
  if (normalized.includes("silver")) return "silver";
  return "free";
}

export function highestTierFromRevenueCat(values: string[]): Tier {
  return values.reduce<Tier>((highest, value) => {
    const candidate = tierFromRevenueCat(value);
    return rank[candidate] > rank[highest] ? candidate : highest;
  }, "free");
}

export async function getTier(client: SupabaseClient, userId: string): Promise<Tier> {
  const { data, error } = await client
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .single();
  if (error) throw new HttpError(500, "tier_lookup_failed", "Could not load subscription tier");
  return (data?.tier ?? "free") as Tier;
}

export async function requireTier(client: SupabaseClient, userId: string, required: Tier): Promise<Tier> {
  const tier = await getTier(client, userId);
  if (!hasTier(tier, required)) {
    throw new HttpError(403, "tier_required", `${required} subscription or higher is required`);
  }
  return tier;
}
