import { withCors } from "../_shared/cors.ts";
import { fail, HttpError, ok, readJson } from "../_shared/errors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { referralRedeemSchema } from "../_shared/schemas.ts";

function codeFor(userId: string): string {
  return `SLICE-${userId.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    if (req.method === "GET") {
      const code = codeFor(ctx.user.id);
      const { data, error } = await ctx.userClient
        .from("referrals")
        .upsert({ user_id: ctx.user.id, code }, { onConflict: "code" })
        .select()
        .single();
      if (error) throw error;
      return ok(data);
    }
    if (req.method === "POST") {
      const body = referralRedeemSchema.parse(await readJson(req));
      const { data: referral, error: findError } = await ctx.adminClient
        .from("referrals")
        .select("*")
        .eq("code", body.code.toUpperCase())
        .maybeSingle();
      if (findError) throw findError;
      if (!referral || referral.user_id === ctx.user.id) throw new HttpError(400, "invalid_referral", "Referral code is invalid");
      const { data, error } = await ctx.userClient
        .from("referrals")
        .upsert({ user_id: ctx.user.id, code: codeFor(ctx.user.id), referred_by_user_id: referral.user_id, redeemed_at: new Date().toISOString() }, { onConflict: "code" })
        .select()
        .single();
      if (error) throw error;
      return ok(data);
    }
    throw new HttpError(405, "method_not_allowed", "Method not allowed");
  } catch (error) {
    return fail(error);
  }
}));
