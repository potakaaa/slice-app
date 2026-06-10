import { withCors } from "../_shared/cors.ts";
import { adminClient } from "../_shared/auth.ts";
import { env } from "../_shared/env.ts";
import { fail, HttpError, ok } from "../_shared/errors.ts";
import { auditLog } from "../_shared/audit.ts";
import { fetchRevenueCatTier } from "../_shared/revenuecat.ts";
import { sendEmail } from "../_shared/email.ts";

function verifyAuthorization(req: Request) {
  const secret = env("REVENUECAT_WEBHOOK_SECRET");
  const authorization = req.headers.get("authorization");
  if (!authorization || authorization !== secret) {
    throw new HttpError(401, "invalid_authorization", "Invalid RevenueCat authorization");
  }
}

Deno.serve((req) => withCors(req, async () => {
  try {
    const raw = await req.text();
    verifyAuthorization(req);
    const body = JSON.parse(raw);
    const event = body.event ?? body;
    const appUserId = event.app_user_id as string | undefined;
    if (!appUserId) throw new HttpError(400, "missing_app_user_id", "RevenueCat app user id is required");

    const admin = adminClient();
    const tier = await fetchRevenueCatTier(appUserId);
    if (!tier) throw new HttpError(500, "revenuecat_not_configured", "RevenueCat API key is required");
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id,email")
      .eq("revenuecat_app_user_id", appUserId)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return ok({ received: true, matched: false });

    await admin.from("subscription_entitlements").insert({
      user_id: profile.id,
      tier,
      source: "revenuecat",
      revenuecat_product_id: event.product_id ?? null,
      revenuecat_app_user_id: appUserId,
      expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
      raw_event: event,
    });
    await admin.from("profiles").update({ tier }).eq("id", profile.id);
    await auditLog(admin, { userId: profile.id, actorType: "revenuecat", action: "subscription_entitlement_synced", severity: "warning", metadata: { tier } });
    if (profile.email) {
      await sendEmail({
        to: profile.email,
        subject: "SLICE subscription updated",
        html: `<p>Your SLICE subscription status is now <strong>${tier}</strong>.</p>`,
      });
    }
    return ok({ received: true, matched: true, tier });
  } catch (error) {
    return fail(error);
  }
}));
