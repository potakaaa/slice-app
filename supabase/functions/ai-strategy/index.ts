import { withCors } from "../_shared/cors.ts";
import { fail, HttpError, ok, readJson } from "../_shared/errors.ts";
import { getClientInfo, requireAuth } from "../_shared/auth.ts";
import { aiStrategyContentSchema, aiStrategySchema } from "../_shared/schemas.ts";
import { requireTier } from "../_shared/subscriptions.ts";
import { enforceAiRateLimit } from "../_shared/rateLimit.ts";
import { safePromptJson } from "../_shared/sanitize.ts";
import { generateGeminiJson } from "../_shared/aiGemini.ts";
import { auditLog } from "../_shared/audit.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    const body = aiStrategySchema.parse(await readJson(req));
    const tier = await requireTier(ctx.adminClient, ctx.user.id, "silver");
    await enforceAiRateLimit(ctx.adminClient, ctx.user.id, tier, "ai_strategy");

    const { data: creditor, error } = await ctx.adminClient
      .from("creditors")
      .select("id,name,balance,settlement_percentage,monthly_savings,status,priority")
      .eq("id", body.creditor_id)
      .eq("user_id", ctx.user.id)
      .single();
    if (error || !creditor) throw new HttpError(404, "creditor_not_found", "Creditor not found");

    const fallback = {
      suggested_first_offer_percentage: Number(creditor.balance) < 3000 ? 0.45 : Number(creditor.balance) < 8000 ? 0.38 : Number(creditor.balance) < 15000 ? 0.33 : 0.30,
      reasoning: "The opening offer leaves room to negotiate while staying below the user's target settlement percentage.",
      strategy_steps: [
        "Prepare a short hardship explanation.",
        "Make a realistic lump-sum offer below your target settlement percentage.",
        "Ask for the agreement in writing before paying.",
      ],
      risks: ["Creditor may reject the offer.", "Forgiven debt may have tax implications."],
      disclaimer: "Educational information only; results are not guaranteed.",
    };
    const prompt = `Create a debt negotiation strategy as JSON with keys suggested_first_offer_percentage, reasoning, strategy_steps, risks, and disclaimer for this creditor context:\n${safePromptJson({ creditor })}`;
    const ai = await generateGeminiJson(prompt, fallback, aiStrategyContentSchema, "ai_strategy");

    await ctx.adminClient.from("ai_chat_messages").insert({
      user_id: ctx.user.id,
      provider: "gemini",
      feature: "ai_strategy",
      role: "assistant",
      content: JSON.stringify(ai.data),
      redacted_context: { creditor_id: creditor.id },
    });
    const clientInfo = getClientInfo(req);
    await auditLog(ctx.adminClient, { userId: ctx.user.id, action: "ai_strategy_generated", ip: clientInfo.ip, userAgent: clientInfo.userAgent });
    return ok({ strategy: ai.data, model: ai.model });
  } catch (error) {
    return fail(error);
  }
}));
