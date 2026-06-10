import { withCors } from "../_shared/cors.ts";
import { fail, ok } from "../_shared/errors.ts";
import { getClientInfo, requireAuth } from "../_shared/auth.ts";
import { auditLog } from "../_shared/audit.ts";

const tables = [
  "profiles",
  "creditors",
  "debt_programs",
  "settlement_scenarios",
  "monthly_savings_plans",
  "credit_score_history",
  "budgets",
  "ai_chat_messages",
  "negotiation_scripts",
  "credit_repair_tasks",
  "coaching_bookings",
  "subscription_entitlements",
  "referrals",
  "push_notification_tokens",
  "scheduled_notifications",
];

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    const data: Record<string, unknown> = {};
    for (const table of tables) {
      const query = ctx.adminClient.from(table).select("*");
      const { data: rows, error } = table === "profiles"
        ? await query.eq("id", ctx.user.id)
        : await query.eq("user_id", ctx.user.id);
      if (error) throw error;
      data[table] = rows;
    }
    const clientInfo = getClientInfo(req);
    await auditLog(ctx.adminClient, {
      userId: ctx.user.id,
      action: "data_export",
      severity: "warning",
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });
    return ok({ exported_at: new Date().toISOString(), data });
  } catch (error) {
    return fail(error);
  }
}));
