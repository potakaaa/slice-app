import { withCors } from "../_shared/cors.ts";
import { fail, ok, readJson } from "../_shared/errors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { zestChatSchema } from "../_shared/schemas.ts";
import { requireTier } from "../_shared/subscriptions.ts";
import { enforceAiRateLimit } from "../_shared/rateLimit.ts";
import { generateGeminiJson } from "../_shared/aiGemini.ts";
import { safePromptJson, stripSensitive } from "../_shared/sanitize.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    const body = zestChatSchema.parse(await readJson(req));
    const tier = await requireTier(ctx.adminClient, ctx.user.id, "silver");
    await enforceAiRateLimit(ctx.adminClient, ctx.user.id, tier, "zest_chat");

    const [{ data: profile }, { data: creditors }] = await Promise.all([
      ctx.adminClient.from("profiles").select("primary_goal,credit_score,default_monthly_savings,tier").eq("id", ctx.user.id).single(),
      ctx.adminClient.from("creditors").select("name,balance,settlement_percentage,status").eq("user_id", ctx.user.id).limit(20),
    ]);

    await ctx.adminClient.from("ai_chat_messages").insert({
      user_id: ctx.user.id,
      provider: "gemini",
      feature: "zest_chat",
      role: "user",
      content: stripSensitive(body.message),
      redacted_context: {},
    });

    const fallback = {
      answer: "I can help you organize your debt-resolution plan and prepare educational negotiation steps. I cannot provide legal, tax, financial, or credit advice.",
      next_steps: ["Review your creditor list.", "Set a realistic savings target.", "Get any agreement in writing before paying."],
      disclaimer: "Educational information only; results are not guaranteed.",
    };
    const prompt = `Answer the user's SLICE debt education question as JSON.\nContext:\n${safePromptJson({ profile, creditors })}\nQuestion:\n${stripSensitive(body.message)}`;
    const ai = await generateGeminiJson(prompt, fallback);

    await ctx.adminClient.from("ai_chat_messages").insert({
      user_id: ctx.user.id,
      provider: "gemini",
      feature: "zest_chat",
      role: "assistant",
      content: JSON.stringify(ai.data),
      redacted_context: { creditor_count: creditors?.length ?? 0 },
    });
    return ok({ message: ai.data, model: ai.model });
  } catch (error) {
    return fail(error);
  }
}));
