import { optionalEnv } from "./env.ts";
import { HttpError } from "./errors.ts";
import { highestTierFromRevenueCat, type Tier } from "./subscriptions.ts";

type RevenueCatEntitlement = {
  expires_date?: string | null;
};

export async function fetchRevenueCatTier(appUserId: string): Promise<Tier | null> {
  const apiKey = optionalEnv("REVENUECAT_API_KEY");
  if (!apiKey) return null;

  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: { authorization: `Bearer ${apiKey}` } },
  );
  if (!response.ok) {
    throw new HttpError(502, "revenuecat_sync_failed", "Could not sync RevenueCat subscription");
  }

  const payload = await response.json();
  const entitlements = (payload?.subscriber?.entitlements ?? {}) as Record<string, RevenueCatEntitlement>;
  const now = Date.now();
  const activeIdentifiers = Object.entries(entitlements)
    .filter(([, entitlement]) => {
      if (!entitlement.expires_date) return true;
      return new Date(entitlement.expires_date).getTime() > now;
    })
    .map(([identifier]) => identifier);

  return highestTierFromRevenueCat(activeIdentifiers);
}
