import { Feather } from "@expo/vector-icons";

import type { SubscriptionTier } from "@/types";

/**
 * Single source of truth for how each subscription tier is presented across the
 * app: pricing screen, TierBadge, UpgradePrompt, the Membership hub, and the
 * post-purchase celebration all read from here so the value story stays
 * consistent.
 *
 * Keep AI_DAILY_LIMITS in sync with `aiDailyLimit()` in
 * `supabase/functions/_shared/subscriptions.ts` (the server enforces those).
 */

type FeatherIcon = keyof typeof Feather.glyphMap;

export interface TierMeta {
  label: string;
  /** Solid brand color used for chips, accents, and CTAs. */
  color: string;
  /** Two-stop gradient for the prestige hero card. */
  gradient: [string, string];
  icon: FeatherIcon;
  tagline: string;
}

export const TIER_ORDER: SubscriptionTier[] = ["free", "silver", "gold", "platinum"];

export const TIER_META: Record<SubscriptionTier, TierMeta> = {
  free: {
    label: "Free",
    color: "#6B7280",
    gradient: ["#9CA3AF", "#6B7280"],
    icon: "user",
    tagline: "Your debt toolkit",
  },
  silver: {
    label: "Silver",
    color: "#64748B",
    gradient: ["#94A3B8", "#475569"],
    icon: "shield",
    tagline: "AI-powered negotiation",
  },
  gold: {
    label: "Gold",
    color: "#B45309",
    gradient: ["#F59E0B", "#B45309"],
    icon: "award",
    tagline: "Coaching + AI, every week",
  },
  platinum: {
    label: "Platinum",
    color: "#7C3AED",
    gradient: ["#A78BFA", "#6D28D9"],
    icon: "star",
    tagline: "We do it with you",
  },
};

/**
 * Per-tool daily AI request allowance. Mirrors `aiDailyLimit()` in
 * `supabase/functions/_shared/subscriptions.ts`. The limit applies to each AI
 * tool (strategy, script, Zest chat) independently.
 */
export const AI_DAILY_LIMITS: Record<SubscriptionTier, number> = {
  free: 0,
  silver: 30,
  gold: 100,
  platinum: 250,
};

export interface TierBenefits {
  /** The 2–3 perks to emphasize for this tier in marketing surfaces. */
  headline: string[];
  /** The full set of perks this tier adds on top of the tier below it. */
  all: string[];
}

export const TIER_BENEFITS: Record<SubscriptionTier, TierBenefits> = {
  free: {
    headline: ["Debt dashboard & calculators", "Snowball payoff timeline"],
    all: [
      "Personal debt dashboard",
      "Creditor list & tracking",
      "Credit score tracker",
      "Settlement calculator (30–70%)",
      "Snowball timeline",
      "Budget & savings tracker",
    ],
  },
  silver: {
    headline: [
      "AI negotiation strategy & scripts",
      "Zest AI Debt Coach",
      "30 AI requests/day per tool",
    ],
    all: [
      "AI negotiation strategy per creditor",
      "AI customized call scripts (4 tones)",
      "Zest AI Debt Coach",
      "Up to 30 AI requests/day per tool",
      "Full call & script history",
      "Copy of our book: Debt Settlements: Dirty Little Secrets",
    ],
  },
  gold: {
    headline: [
      "Live weekly Zoom coaching",
      "1-on-1 founder coaching",
      "100 AI requests/day per tool",
    ],
    all: [
      "Live weekly Zoom coaching calls",
      "1-on-1 founder coaching with Marc",
      "Tax advisory booking",
      "Up to 100 AI requests/day per tool",
    ],
  },
  platinum: {
    headline: [
      "Done-with-you creditor calls",
      "Priority founder coaching",
      "250 AI requests/day per tool",
    ],
    all: [
      "Live done-with-you creditor calls",
      "Priority founder coaching",
      "Priority support",
      "Up to 250 AI requests/day per tool",
    ],
  },
};

export function tierRank(tier: SubscriptionTier): number {
  return TIER_ORDER.indexOf(tier);
}

/** Returns true when `tier` is at or above `required`. */
export function tierMeets(tier: SubscriptionTier, required: SubscriptionTier): boolean {
  return tierRank(tier) >= tierRank(required);
}

/** The next tier up, or null when already at the top tier. */
export function nextTier(tier: SubscriptionTier): SubscriptionTier | null {
  return TIER_ORDER[tierRank(tier) + 1] ?? null;
}

/**
 * Every paid benefit a member has unlocked at their current tier, accumulated
 * from Silver up to (and including) the current tier. Free returns the base
 * toolkit so the hub still has something to show.
 */
export function benefitsUnlockedBy(tier: SubscriptionTier): string[] {
  if (tier === "free") return TIER_BENEFITS.free.all;
  return TIER_ORDER.filter((t) => t !== "free" && tierRank(t) <= tierRank(tier)).flatMap(
    (t) => TIER_BENEFITS[t].all,
  );
}
