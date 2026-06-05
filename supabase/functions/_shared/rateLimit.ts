import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { HttpError } from "./errors.ts";
import { aiDailyLimit, type Tier } from "./subscriptions.ts";

export async function enforceAiRateLimit(
  client: SupabaseClient,
  userId: string,
  tier: Tier,
  feature: string,
) {
  const limit = aiDailyLimit(tier);
  if (limit <= 0) throw new HttpError(403, "tier_required", "Paid subscription is required for AI features");

  const today = new Date().toISOString().slice(0, 10);
  const { data } = await client
    .from("rate_limits")
    .select("id,count")
    .eq("user_id", userId)
    .eq("feature", feature)
    .eq("window_start", today)
    .maybeSingle();

  if ((data?.count ?? 0) >= limit) {
    throw new HttpError(429, "rate_limit_exceeded", "Daily AI limit reached for your subscription tier");
  }

  if (data?.id) {
    const { error } = await client.from("rate_limits").update({ count: data.count + 1 }).eq("id", data.id);
    if (error) throw new HttpError(500, "rate_limit_failed", "Could not update rate limit");
    return { used: data.count + 1, limit };
  }

  const { error } = await client.from("rate_limits").insert({
    user_id: userId,
    feature,
    window_start: today,
    count: 1,
  });
  if (error) throw new HttpError(500, "rate_limit_failed", "Could not create rate limit");
  return { used: 1, limit };
}
