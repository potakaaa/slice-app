import { withCors } from "../_shared/cors.ts";
import { fail, HttpError, ok, readJson } from "../_shared/errors.ts";
import { getClientInfo, requireAuth } from "../_shared/auth.ts";
import { aiScriptContentSchema, aiScriptSchema } from "../_shared/schemas.ts";
import { requireTier } from "../_shared/subscriptions.ts";
import { enforceAiRateLimit } from "../_shared/rateLimit.ts";
import { generateGeminiJson } from "../_shared/aiGemini.ts";
import { safePromptJson } from "../_shared/sanitize.ts";
import { auditLog } from "../_shared/audit.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    const body = aiScriptSchema.parse(await readJson(req));
    const tier = await requireTier(ctx.adminClient, ctx.user.id, "silver");
    await enforceAiRateLimit(ctx.adminClient, ctx.user.id, tier, "ai_script");

    const { data: creditor, error } = await ctx.adminClient
      .from("creditors")
      .select("id,name,balance,settlement_percentage,monthly_savings,status")
      .eq("id", body.creditor_id)
      .eq("user_id", ctx.user.id)
      .single();
    if (error || !creditor) throw new HttpError(404, "creditor_not_found", "Creditor not found");

    const fallback = {
      tone: body.tone,
      sections: {
        first_call: "I am calling about my account and would like to discuss settlement options. Can you connect me with the hardship or settlement department?",
        settlement_offer: "I can offer a lump-sum settlement to resolve this account, subject to receiving the agreement in writing before payment.",
        follow_up: "I am following up on my settlement request and would like to confirm next steps.",
        confirmation: "Before I make payment, please confirm the settlement amount and reporting terms in writing.",
      },
      reminders: ["Do not share full bank/card numbers.", "Get the agreement in writing before paying."],
      disclaimer: "Template for educational use only; results are not guaranteed.",
    };
    const prompt = [
      `Generate a debt-negotiation call script as a single JSON object using tone "${body.tone}".`,
      `Reflect the "${body.tone}" tone throughout the wording (e.g. "hardship" must emphasize genuine financial difficulty).`,
      `Return EXACTLY this shape with no extra keys and no nesting:`,
      `{"tone":"${body.tone}","sections":{"first_call":"<text>","settlement_offer":"<text>","follow_up":"<text>","confirmation":"<text>"},"reminders":["<text>"],"disclaimer":"<text>"}`,
      `Every section value MUST be a non-empty plain string (not an object or array). Use [brackets] for details the caller must fill in.`,
      `Creditor context:\n${safePromptJson({ creditor })}`,
    ].join("\n");
    const ai = await generateGeminiJson(prompt, fallback, aiScriptContentSchema, "ai_script");

    const { data: saved, error: saveError } = await ctx.adminClient.from("negotiation_scripts").insert({
      user_id: ctx.user.id,
      creditor_id: creditor.id,
      tone: body.tone,
      script: ai.data,
      provider: ai.usedFallback ? "fallback" : "gemini",
      model: ai.model,
    }).select().single();
    if (saveError) throw saveError;
    const clientInfo = getClientInfo(req);
    await auditLog(ctx.adminClient, {
      userId: ctx.user.id,
      action: ai.usedFallback ? "ai_script_fallback" : "ai_script_generated",
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });
    return ok({ script: ai.data, saved_script_id: saved.id, model: ai.model, used_fallback: ai.usedFallback });
  } catch (error) {
    return fail(error);
  }
}));
