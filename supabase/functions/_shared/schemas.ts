import { z } from "https://esm.sh/zod@3.25.76";

export const uuidSchema = z.string().uuid();
export const tierSchema = z.enum(["free", "silver", "gold", "platinum"]);
export const scriptToneSchema = z.enum(["calm", "firm", "hardship", "direct"]);

export const profileUpsertSchema = z.object({
  full_name: z.string().trim().max(120).optional(),
  primary_goal: z.enum(["settle", "repair", "prepare", "payoff"]).optional(),
  credit_score: z.number().int().min(300).max(850).optional(),
  default_settlement_percentage: z.number().min(0.01).max(1).optional(),
  default_monthly_savings: z.number().min(0).optional(),
  revenuecat_app_user_id: z.string().trim().max(200).optional(),
  privacy_policy_version: z.string().trim().max(40).optional(),
  privacy_policy_accepted: z.boolean().optional(),
  terms_version: z.string().trim().max(40).optional(),
  terms_accepted: z.boolean().optional(),
  onboarding_complete: z.boolean().optional(),
});

export const creditorInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(40).optional().nullable(),
  balance: z.number().min(0),
  settlement_percentage: z.number().min(0.01).max(1),
  monthly_savings: z.number().min(0).default(0),
  status: z.enum(["active", "negotiating", "settled", "closed"]).default("active"),
  priority: z.number().int().min(0).default(0),
  notes: z.string().trim().max(4000).optional().nullable(),
  account_last4: z.string().regex(/^\d{4}$/).optional().nullable(),
});

export const creditorPatchSchema = creditorInputSchema.partial().extend({ id: uuidSchema });

export const settlementCalculateSchema = z.object({
  balance: z.number().min(0),
  settlement_percentage: z.number().min(0.01).max(1),
});

export const savingsCalculateSchema = z.object({
  settlement_amount: z.number().min(0),
  monthly_savings: z.number().min(0),
});

export const creditScoreInputSchema = z.object({
  score: z.number().int().min(300).max(850),
  source: z.string().trim().max(80).optional(),
  recorded_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const budgetInputSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  income: z.number().min(0).default(0),
  essentials: z.number().min(0).default(0),
  debt_savings: z.number().min(0).default(0),
  discretionary: z.number().min(0).default(0),
  notes: z.string().trim().max(4000).optional().nullable(),
});

export const aiStrategySchema = z.object({ creditor_id: uuidSchema });
export const aiScriptSchema = z.object({ creditor_id: uuidSchema, tone: scriptToneSchema });
export const zestChatSchema = z.object({ message: z.string().trim().min(1).max(3000) });

export const coachingBookingSchema = z.object({
  topic: z.string().trim().min(1).max(160),
  notes: z.string().trim().max(3000).optional(),
});

export const communicationPreferencesSchema = z.object({
  marketing_emails_enabled: z.boolean().optional(),
  transactional_emails_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
});

export const pushTokenSchema = z.object({
  expo_token: z.string().trim().min(10).max(500),
  platform: z.enum(["ios", "android", "web"]),
  enabled: z.boolean().default(true),
});

export const referralRedeemSchema = z.object({
  code: z.string().trim().min(3).max(32),
});
