import { withCors } from "../_shared/cors.ts";
import { fail, ok, readJson } from "../_shared/errors.ts";
import { getClientInfo, requireAuth } from "../_shared/auth.ts";
import { auditLog } from "../_shared/audit.ts";
import { legalVersions } from "../_shared/env.ts";
import { profileUpsertSchema } from "../_shared/schemas.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    const body = profileUpsertSchema.parse(await readJson(req));
    const versions = legalVersions();
    const now = new Date().toISOString();
    const payload = {
      id: ctx.user.id,
      email: ctx.user.email ?? "",
      ...body,
      privacy_policy_version: body.privacy_policy_version ?? versions.privacyVersion,
      privacy_policy_accepted_at: body.privacy_policy_accepted ? now : undefined,
      terms_version: body.terms_version ?? versions.termsVersion,
      terms_accepted_at: body.terms_accepted ? now : undefined,
    };

    const { data, error } = await ctx.userClient
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();
    if (error) throw error;

    const clientInfo = getClientInfo(req);
    await auditLog(ctx.adminClient, {
      userId: ctx.user.id,
      action: "profile_upsert",
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}));
