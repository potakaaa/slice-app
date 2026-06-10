import { withCors } from "../_shared/cors.ts";
import { fail, ok } from "../_shared/errors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { getTier } from "../_shared/subscriptions.ts";
import { enforceAiRateLimit } from "../_shared/rateLimit.ts";
import { generateGeminiJson } from "../_shared/aiGemini.ts";
import { safePromptJson } from "../_shared/sanitize.ts";

const defaults = [
  { title: "Request your free credit report", category: "Report", description: "Use AnnualCreditReport.com to review your report." },
  { title: "Review account accuracy", category: "Report", description: "Look for inaccurate balances, dates, or ownership." },
  { title: "Keep settlement documents", category: "Documentation", description: "Save written agreements and payoff confirmations." },
];

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    const tier = await getTier(ctx.adminClient, ctx.user.id);
    if (tier === "free") {
      return ok({ tasks: defaults, generated: false });
    }

    await enforceAiRateLimit(ctx.adminClient, ctx.user.id, tier, "credit_repair_tasks");
    const { data: creditors } = await ctx.adminClient.from("creditors").select("name,status,balance").eq("user_id", ctx.user.id);
    const ai = await generateGeminiJson(
      `Generate JSON credit repair task objects with title, category, and description for:\n${safePromptJson({ creditors })}`,
      { tasks: defaults },
    );
    const tasks = Array.isArray((ai.data as { tasks?: unknown }).tasks) ? (ai.data as { tasks: unknown[] }).tasks : defaults;
    const { data, error } = await ctx.adminClient.from("credit_repair_tasks").insert(
      tasks.slice(0, 10).map((task) => ({ ...(task as Record<string, unknown>), user_id: ctx.user.id })),
    ).select();
    if (error) throw error;
    return ok({ tasks: data, model: ai.model });
  } catch (error) {
    return fail(error);
  }
}));
