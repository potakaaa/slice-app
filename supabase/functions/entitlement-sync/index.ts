import { withCors } from "../_shared/cors.ts";
import { fail, ok } from "../_shared/errors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { fetchRevenueCatTier } from "../_shared/revenuecat.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    const { data: profile, error } = await ctx.adminClient
      .from("profiles")
      .select("revenuecat_app_user_id,tier")
      .eq("id", ctx.user.id)
      .single();
    if (error) throw error;

    if (!profile?.revenuecat_app_user_id) {
      return ok({ tier: profile?.tier ?? "free", synced: false });
    }

    const tier = await fetchRevenueCatTier(profile.revenuecat_app_user_id);
    if (!tier) return ok({ tier: profile.tier, synced: false });
    await ctx.adminClient.from("profiles").update({ tier }).eq("id", ctx.user.id);
    return ok({ tier, synced: true });
  } catch (error) {
    return fail(error);
  }
}));
