import { withCors } from "../_shared/cors.ts";
import { fail, ok } from "../_shared/errors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { optionalEnv } from "../_shared/env.ts";
import { tierFromRevenueCat } from "../_shared/subscriptions.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    const { data: profile, error } = await ctx.adminClient
      .from("profiles")
      .select("revenuecat_app_user_id,tier")
      .eq("id", ctx.user.id)
      .single();
    if (error) throw error;

    const apiKey = optionalEnv("REVENUECAT_API_KEY");
    if (!apiKey || !profile?.revenuecat_app_user_id) {
      return ok({ tier: profile?.tier ?? "free", synced: false });
    }

    const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(profile.revenuecat_app_user_id)}`, {
      headers: { authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return ok({ tier: profile.tier, synced: false });
    const rc = await res.json();
    const entitlementKeys = Object.keys(rc?.subscriber?.entitlements ?? {});
    const tier = tierFromRevenueCat(entitlementKeys.sort().at(-1));
    await ctx.adminClient.from("profiles").update({ tier }).eq("id", ctx.user.id);
    return ok({ tier, synced: true });
  } catch (error) {
    return fail(error);
  }
}));
