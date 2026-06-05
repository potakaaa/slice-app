import { withCors } from "../_shared/cors.ts";
import { fail, ok } from "../_shared/errors.ts";
import { getClientInfo, requireAuth } from "../_shared/auth.ts";
import { auditLog } from "../_shared/audit.ts";
import { sendEmail } from "../_shared/email.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    const clientInfo = getClientInfo(req);
    await auditLog(ctx.adminClient, {
      userId: ctx.user.id,
      action: "account_delete_requested",
      severity: "critical",
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });
    await ctx.adminClient.from("profiles").update({ deletion_requested_at: new Date().toISOString() }).eq("id", ctx.user.id);
    await ctx.adminClient.auth.admin.deleteUser(ctx.user.id);
    if (ctx.user.email) {
      await sendEmail({
        to: ctx.user.email,
        subject: "Your SLICE account was deleted",
        html: "<p>Your SLICE account deletion request has been completed.</p>",
      });
    }
    return ok({ deleted: true });
  } catch (error) {
    return fail(error);
  }
}));
