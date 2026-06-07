import { z } from "zod";

export const SubscriptionTier = z.enum(["free", "silver", "gold", "platinum"]);
export type SubscriptionTier = z.infer<typeof SubscriptionTier>;

export const ApiErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export const apiSuccess = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({ ok: z.literal(true), data: schema });

export const ProfileUpsertRequest = z.object({
  full_name: z.string().max(120).optional(),
  primary_goal: z.enum(["settle", "repair", "prepare", "payoff"]).optional(),
  credit_score: z.number().int().min(300).max(850).optional(),
  default_settlement_percentage: z.number().min(0.01).max(1).optional(),
  default_monthly_savings: z.number().min(0).optional(),
  revenuecat_app_user_id: z.string().max(200).optional(),
  privacy_policy_version: z.string().max(40).optional(),
  privacy_policy_accepted: z.boolean().optional(),
  terms_version: z.string().max(40).optional(),
  terms_accepted: z.boolean().optional(),
  onboarding_complete: z.boolean().optional(),
});
export type ProfileUpsertRequest = z.infer<typeof ProfileUpsertRequest>;

export const CreditorRequest = z.object({
  name: z.string().min(1).max(160),
  phone: z.string().max(40).nullable().optional(),
  balance: z.number().min(0),
  settlement_percentage: z.number().min(0.01).max(1),
  monthly_savings: z.number().min(0).default(0),
  status: z.enum(["active", "negotiating", "settled", "closed"]).default("active"),
  priority: z.number().int().min(0).default(0),
  notes: z.string().max(4000).nullable().optional(),
  account_last4: z.string().regex(/^\d{4}$/).nullable().optional(),
});
export type CreditorRequest = z.infer<typeof CreditorRequest>;

export const CreditorPatchRequest = CreditorRequest.partial().extend({
  id: z.string().uuid(),
});
export type CreditorPatchRequest = z.infer<typeof CreditorPatchRequest>;

export const SettlementCalculateRequest = z.object({
  balance: z.number().min(0),
  settlement_percentage: z.number().min(0.01).max(1),
});
export type SettlementCalculateRequest = z.infer<typeof SettlementCalculateRequest>;

export const SavingsPlanCalculateRequest = z.object({
  settlement_amount: z.number().min(0),
  monthly_savings: z.number().min(0),
});
export type SavingsPlanCalculateRequest = z.infer<typeof SavingsPlanCalculateRequest>;

export const CreditScoreRequest = z.object({
  score: z.number().int().min(300).max(850),
  source: z.string().max(80).optional(),
  recorded_on: z.string().optional(),
});
export type CreditScoreRequest = z.infer<typeof CreditScoreRequest>;

export const BudgetRequest = z.object({
  month: z.string(),
  income: z.number().min(0).default(0),
  essentials: z.number().min(0).default(0),
  debt_savings: z.number().min(0).default(0),
  discretionary: z.number().min(0).default(0),
  notes: z.string().max(4000).nullable().optional(),
});
export type BudgetRequest = z.infer<typeof BudgetRequest>;

export const AiStrategyRequest = z.object({ creditor_id: z.string().uuid() });
export type AiStrategyRequest = z.infer<typeof AiStrategyRequest>;

export const AiStrategyContent = z.object({
  suggested_first_offer_percentage: z.number().min(0.01).max(1),
  reasoning: z.string().min(1),
  strategy_steps: z.array(z.string().min(1)).min(1),
  risks: z.array(z.string().min(1)),
  disclaimer: z.string().min(1),
});
export type AiStrategyContent = z.infer<typeof AiStrategyContent>;

export const AiStrategyResponse = z.object({
  strategy: AiStrategyContent,
  model: z.string().min(1),
});
export type AiStrategyResponse = z.infer<typeof AiStrategyResponse>;

export const AiScriptRequest = z.object({
  creditor_id: z.string().uuid(),
  tone: z.enum(["calm", "firm", "hardship", "direct"]),
});
export type AiScriptRequest = z.infer<typeof AiScriptRequest>;

export const AiScriptContent = z.object({
  tone: z.enum(["calm", "firm", "hardship", "direct"]),
  sections: z.record(z.string(), z.string().min(1)).refine(
    (sections) => Object.keys(sections).length > 0,
    "At least one script section is required",
  ),
  reminders: z.array(z.string().min(1)),
  disclaimer: z.string().min(1),
});
export type AiScriptContent = z.infer<typeof AiScriptContent>;

export const AiScriptResponse = z.object({
  script: AiScriptContent,
  saved_script_id: z.string().uuid(),
  model: z.string().min(1),
});
export type AiScriptResponse = z.infer<typeof AiScriptResponse>;

export const ZestChatRequest = z.object({
  message: z.string().min(1).max(3000),
});
export type ZestChatRequest = z.infer<typeof ZestChatRequest>;

export const CoachingBookingRequest = z.object({
  topic: z.string().min(1).max(160),
  notes: z.string().max(3000).optional(),
});
export type CoachingBookingRequest = z.infer<typeof CoachingBookingRequest>;

export const CoachingBookingResponse = z.object({
  booking: z.object({
    id: z.string().uuid(),
    topic: z.string(),
    notes: z.string().nullable(),
    starts_at: z.string().nullable(),
    status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
    created_at: z.string(),
  }),
  scheduling_url: z.string().url().nullable(),
  scheduling_available: z.boolean(),
});
export type CoachingBookingResponse = z.infer<typeof CoachingBookingResponse>;

export const CommunicationPreferencesRequest = z.object({
  marketing_emails_enabled: z.boolean().optional(),
  transactional_emails_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
});
export type CommunicationPreferencesRequest = z.infer<typeof CommunicationPreferencesRequest>;

export const PushTokenRequest = z.object({
  expo_token: z.string().min(10).max(500),
  platform: z.enum(["ios", "android", "web"]),
  enabled: z.boolean().default(true),
});
export type PushTokenRequest = z.infer<typeof PushTokenRequest>;
