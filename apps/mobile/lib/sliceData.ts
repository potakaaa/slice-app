import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/lib/auth";
import { createSliceApiClient } from "@/lib/sliceApi";
import { supabase } from "@/lib/supabase";
import { AI_DAILY_LIMITS } from "@/lib/tierBenefits";
import type {
  CoachingBooking,
  ContactLog,
  ContactOutcome,
  Creditor,
  CreditRepairTask,
  DebtProgram,
  NegotiationScript,
  PrimaryGoal,
  SavingsTrackerMonth,
  ScriptTone,
  SubscriptionTier,
  UserProfile,
} from "@/types";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  primary_goal: PrimaryGoal | null;
  credit_score: number | null;
  default_settlement_percentage: number | string | null;
  default_monthly_savings: number | string | null;
  current_saved_cash: number | string | null;
  tier: SubscriptionTier;
  onboarding_complete: boolean;
};

type CreditorRow = {
  id: string;
  name: string;
  phone: string | null;
  balance: number | string;
  settlement_percentage: number | string;
  monthly_savings: number | string;
  status: Creditor["status"];
  notes: string | null;
  priority: number;
  created_at: string;
};

type CreditRepairTaskRow = {
  id: string;
  title: string;
  category: string;
  completed_at: string | null;
};

type CoachingBookingRow = {
  id: string;
  topic: string;
  notes: string | null;
  starts_at: string | null;
  status: CoachingBooking["status"];
  created_at: string;
};

type ContactLogRow = {
  id: string;
  creditor_id: string;
  contact_date: string;
  outcome: string;
  amount_offered: number | string | null;
  follow_up_date: string | null;
  notes: string | null;
};

type NegotiationScriptRow = {
  id: string;
  creditor_id: string;
  tone: string;
  script: {
    tone?: string;
    sections?: Record<string, string>;
    reminders?: string[];
  } | null;
  created_at: string;
};

type AggregateProgramApiResponse = {
  program: {
    id: string;
    totalDebt: number;
    estimatedSettlementAmount: number;
    monthlySavingsAmount: number;
    programLengthMonths: number;
    settlementRate: number;
    disclosureAccepted: boolean;
    disclosureAcceptedAt?: string | null;
  } | null;
  months: Array<{
    id: string;
    programId: string;
    monthIndex: number;
    monthlyAmount: number;
    status: SavingsTrackerMonth["status"];
    savedAt: string | null;
  }>;
};

export const DEFAULT_PROFILE: UserProfile = {
  name: "",
  email: "",
  creditScore: 0,
  primaryGoal: "settle",
  defaultSettlementPercentage: 0.5,
  defaultMonthlySavings: 500,
  currentSavedCash: 0,
  tier: "free",
  onboardingComplete: false,
};

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function mapProfile(row: ProfileRow | null | undefined): UserProfile {
  if (!row) return DEFAULT_PROFILE;
  return {
    name: row.full_name ?? "",
    email: row.email,
    creditScore: row.credit_score ?? 0,
    primaryGoal: row.primary_goal ?? "settle",
    defaultSettlementPercentage: toNumber(row.default_settlement_percentage, 0.5),
    defaultMonthlySavings: toNumber(row.default_monthly_savings, 500),
    currentSavedCash: toNumber(row.current_saved_cash, 0),
    tier: row.tier,
    onboardingComplete: row.onboarding_complete,
  };
}

export function mapCreditor(row: CreditorRow): Creditor {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? "",
    balance: toNumber(row.balance),
    settlementPercentage: toNumber(row.settlement_percentage, 0.5),
    monthlySavings: toNumber(row.monthly_savings),
    status: row.status,
    notes: row.notes ?? "",
    priority: row.priority,
    addedAt: row.created_at,
  };
}

function mapTask(row: CreditRepairTaskRow): CreditRepairTask {
  return {
    id: row.id,
    task: row.title,
    category: row.category,
    completed: Boolean(row.completed_at),
  };
}

function mapBooking(row: CoachingBookingRow): CoachingBooking {
  return {
    id: row.id,
    topic: row.topic,
    notes: row.notes ?? "",
    date: row.starts_at ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapContactLog(row: ContactLogRow): ContactLog {
  return {
    id: row.id,
    creditorId: row.creditor_id,
    contactDate: row.contact_date,
    outcome: row.outcome as ContactOutcome,
    amountOffered: row.amount_offered == null ? null : toNumber(row.amount_offered),
    followUpDate: row.follow_up_date,
    notes: row.notes ?? "",
  };
}

function mapNegotiationScript(row: NegotiationScriptRow): NegotiationScript {
  return {
    id: row.id,
    creditorId: row.creditor_id,
    tone: row.tone as ScriptTone,
    sections: row.script?.sections ?? {},
    reminders: row.script?.reminders ?? [],
    createdAt: row.created_at,
  };
}

function mapAggregateProgramResponse(response: AggregateProgramApiResponse): {
  program: DebtProgram | null;
  months: SavingsTrackerMonth[];
} {
  return {
    program: response.program
      ? {
        id: response.program.id,
        totalDebt: toNumber(response.program.totalDebt),
        estimatedSettlementAmount: toNumber(response.program.estimatedSettlementAmount),
        monthlySavingsAmount: toNumber(response.program.monthlySavingsAmount),
        programLengthMonths: response.program.programLengthMonths,
        settlementRate: toNumber(response.program.settlementRate, 0.5),
        disclosureAccepted: response.program.disclosureAccepted,
        disclosureAcceptedAt: response.program.disclosureAcceptedAt ?? null,
      }
      : null,
    months: response.months.map((month) => ({
      id: month.id,
      programId: month.programId,
      monthIndex: month.monthIndex,
      monthlyAmount: toNumber(month.monthlyAmount),
      status: month.status,
      savedAt: month.savedAt,
    })),
  };
}

export function useProfile() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) throw new Error("User is required");
      const authName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : typeof user.user_metadata?.name === "string"
            ? user.user_metadata.name
            : "";
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const profile = mapProfile(data as ProfileRow);
        return {
          ...profile,
          name: profile.name || authName,
          email: profile.email || user.email || "",
        };
      }

      const { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email ?? "",
            full_name: authName || null,
          },
          { onConflict: "id" }
        )
        .select("*")
        .single();
      if (insertError) throw insertError;
      return mapProfile(inserted as ProfileRow);
    },
  });

  return {
    ...query,
    profile: query.data ?? DEFAULT_PROFILE,
  };
}

export function useUpsertProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile> & { termsAccepted?: boolean; privacyAccepted?: boolean }) => {
      const api = createSliceApiClient();
      return api.profileUpsert({
        full_name: updates.name,
        primary_goal: updates.primaryGoal,
        credit_score: updates.creditScore && updates.creditScore > 0 ? updates.creditScore : undefined,
        default_settlement_percentage: updates.defaultSettlementPercentage,
        default_monthly_savings: updates.defaultMonthlySavings,
        current_saved_cash: updates.currentSavedCash,
        onboarding_complete: updates.onboardingComplete,
        terms_accepted: updates.termsAccepted,
        privacy_policy_accepted: updates.privacyAccepted,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}

/**
 * The AI tools that consume the per-tool daily request allowance. The `key`
 * values match the `feature` strings the backend writes to `rate_limits`
 * (see supabase/functions/_shared/rateLimit.ts).
 */
export const AI_USAGE_FEATURES = [
  { key: "ai_strategy", label: "AI Strategy" },
  { key: "ai_script", label: "Call Scripts" },
  { key: "zest_chat", label: "Zest Coach" },
] as const;

export type AiUsageFeature = {
  key: string;
  label: string;
  used: number;
  limit: number;
};

/**
 * Today's AI usage per tool for the signed-in user. Reads the RLS-protected
 * `rate_limits` table directly; the daily limit comes from the client mirror
 * in tierBenefits.ts keyed by the user's tier.
 */
export function useAiUsage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const limit = AI_DAILY_LIMITS[profile.tier];

  const query = useQuery({
    queryKey: ["ai-usage", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("rate_limits")
        .select("feature,count")
        .eq("window_start", today);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of (data as { feature: string; count: number }[]) ?? []) {
        counts[row.feature] = row.count;
      }
      return counts;
    },
  });

  const counts = query.data ?? {};
  const features: AiUsageFeature[] = AI_USAGE_FEATURES.map((feature) => ({
    key: feature.key,
    label: feature.label,
    used: counts[feature.key] ?? 0,
    limit,
  }));

  return { ...query, features, limit };
}

export function useCreditors() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["creditors", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const api = createSliceApiClient();
      const rows = await api.listCreditors();
      return (rows as CreditorRow[]).map(mapCreditor);
    },
  });

  return {
    ...query,
    creditors: query.data ?? [],
  };
}

export function useCreateCreditor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (creditor: Omit<Creditor, "id" | "addedAt" | "priority" | "status" | "notes"> & { priority?: number }) => {
      const api = createSliceApiClient();
      return api.createCreditor({
        name: creditor.name,
        phone: creditor.phone || null,
        balance: creditor.balance,
        settlement_percentage: creditor.settlementPercentage,
        monthly_savings: creditor.monthlySavings,
        priority: creditor.priority ?? 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creditors", user?.id] });
    },
  });
}

export function useUpdateCreditor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Creditor> }) => {
      const api = createSliceApiClient();
      return api.updateCreditor({
        id,
        name: updates.name,
        phone: updates.phone,
        balance: updates.balance,
        settlement_percentage: updates.settlementPercentage,
        monthly_savings: updates.monthlySavings,
        status: updates.status,
        notes: updates.notes,
        priority: updates.priority,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creditors", user?.id] });
    },
  });
}

export function useDeleteCreditor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const api = createSliceApiClient();
      return api.deleteCreditor(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creditors", user?.id] });
    },
  });
}

export function useCreditRepairTasks() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["credit-repair-tasks", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_repair_tasks")
        .select("id,title,category,completed_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as CreditRepairTaskRow[]).map(mapTask);
    },
  });

  return {
    ...query,
    creditRepairTasks: query.data ?? [],
  };
}

export function useToggleCreditRepairTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (task: CreditRepairTask) => {
      const { error } = await supabase
        .from("credit_repair_tasks")
        .update({ completed_at: task.completed ? null : new Date().toISOString() })
        .eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-repair-tasks", user?.id] });
    },
  });
}

export function useCoachingBookings() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["coaching-bookings", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_bookings")
        .select("id,topic,notes,starts_at,status,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as CoachingBookingRow[]).map(mapBooking);
    },
  });

  return {
    ...query,
    coachingBookings: query.data ?? [],
  };
}

export function useContactLogs(creditorId: string | undefined) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["contact-logs", user?.id, creditorId],
    enabled: Boolean(user) && Boolean(creditorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creditor_contact_logs")
        .select("id,creditor_id,contact_date,outcome,amount_offered,follow_up_date,notes")
        .eq("creditor_id", creditorId as string)
        .order("contact_date", { ascending: false });
      if (error) throw error;
      return (data as ContactLogRow[]).map(mapContactLog);
    },
  });

  return {
    ...query,
    contactLogs: query.data ?? [],
  };
}

export function useCreateContactLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      creditorId: string;
      outcome: ContactOutcome;
      amountOffered: number | null;
      followUpDate: string | null;
      notes: string;
    }) => {
      if (!user) throw new Error("User is required");
      const { error } = await supabase.from("creditor_contact_logs").insert({
        user_id: user.id,
        creditor_id: input.creditorId,
        outcome: input.outcome,
        amount_offered: input.amountOffered,
        follow_up_date: input.followUpDate,
        notes: input.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ["contact-logs", user?.id, input.creditorId] });
    },
  });
}

export function useNegotiationScripts(creditorId: string | undefined) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["negotiation-scripts", user?.id, creditorId],
    enabled: Boolean(user) && Boolean(creditorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("negotiation_scripts")
        .select("id,creditor_id,tone,script,created_at")
        .eq("creditor_id", creditorId as string)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as NegotiationScriptRow[]).map(mapNegotiationScript);
    },
  });

  return {
    ...query,
    scripts: query.data ?? [],
  };
}

export function useRequestCoaching() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ topic, notes }: { topic: string; notes?: string }) => {
      const api = createSliceApiClient();
      return api.requestCoaching(topic, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaching-bookings", user?.id] });
    },
  });
}

export function useGenerateAiStrategy() {
  return useMutation({
    mutationFn: async (creditorId: string) => {
      const api = createSliceApiClient();
      return api.generateAiStrategy(creditorId);
    },
  });
}

export function useGenerateAiScript() {
  return useMutation({
    mutationFn: async ({ creditorId, tone }: { creditorId: string; tone: "calm" | "firm" | "hardship" | "direct" }) => {
      const api = createSliceApiClient();
      return api.generateAiScript(creditorId, tone);
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const api = createSliceApiClient();
      return api.deleteAccount();
    },
  });
}

export function useAggregateProgram() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["aggregate-program", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const api = createSliceApiClient();
      const response = await api.getAggregateProgram();
      return mapAggregateProgramResponse(response);
    },
  });

  return {
    ...query,
    debtProgram: query.data?.program ?? null,
    trackerMonths: query.data?.months ?? [],
  };
}

export function useSyncAggregateProgram() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ acceptDisclosure = false }: { acceptDisclosure?: boolean } = {}) => {
      const api = createSliceApiClient();
      const response = await api.syncAggregateProgram(acceptDisclosure);
      return mapAggregateProgramResponse(response);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["aggregate-program", user?.id], data);
    },
  });
}

export function useToggleSavingsTrackerMonth() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ monthId, saved }: { monthId: string; saved: boolean }) => {
      const api = createSliceApiClient();
      const response = await api.toggleSavingsTrackerMonth(monthId, saved);
      return mapAggregateProgramResponse(response);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["aggregate-program", user?.id], data);
    },
  });
}
