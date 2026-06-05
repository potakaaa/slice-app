import { withCors } from "../_shared/cors.ts";
import { adminClient } from "../_shared/auth.ts";
import { env } from "../_shared/env.ts";
import { fail, HttpError, ok } from "../_shared/errors.ts";
import { auditLog } from "../_shared/audit.ts";
import { tierFromRevenueCat } from "../_shared/subscriptions.ts";
import { sendEmail } from "../_shared/email.ts";

async function verifySignature(req: Request, raw: string) {
  const secret = env("REVENUECAT_WEBHOOK_SECRET");
  const signature = req.headers.get("x-revenuecat-signature");
  if (!signature) throw new HttpError(401, "invalid_signature", "Missing RevenueCat signature");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const expected = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (signature !== expected) throw new HttpError(401, "invalid_signature", "Invalid RevenueCat signature");
}

Deno.serve((req) => withCors(req, async () => {
  try {
    const raw = await req.text();
    await verifySignature(req, raw);
    const body = JSON.parse(raw);
    const event = body.event ?? body;
    const appUserId = event.app_user_id as string | undefined;
    if (!appUserId) throw new HttpError(400, "missing_app_user_id", "RevenueCat app user id is required");

    const admin = adminClient();
    const tier = tierFromRevenueCat(event.entitlement_id ?? event.product_id);
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
