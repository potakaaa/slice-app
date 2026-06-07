import type {
  AiScriptResponse,
  AiStrategyResponse,
  CoachingBookingResponse,
  ProfileUpsertRequest,
} from "@workspace/api-zod";
import {
  AiScriptResponse as AiScriptResponseSchema,
  AiStrategyResponse as AiStrategyResponseSchema,
  CoachingBookingResponse as CoachingBookingResponseSchema,
} from "@workspace/api-zod";
import type { ZodType } from "zod";

import { IntegrationError } from "./integrationErrors";
import { getCurrentAccessToken, getSupabasePublicConfig, type AccessTokenProvider } from "./supabase";
import type { DebtProgram, SavingsTrackerMonth } from "@/types";

export type SliceApiSuccess<T> = { ok: true; data: T };
export type SliceApiError = { ok: false; error: { code: string; message: string } };
export type SliceApiResponse<T> = SliceApiSuccess<T> | SliceApiError;
export type AggregateProgramResponse = {
  program: DebtProgram | null;
  months: SavingsTrackerMonth[];
};

export class SliceApiClient {
  constructor(private readonly getAccessToken: AccessTokenProvider) {}

  async call<T>(
    functionName: string,
    options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; query?: Record<string, string> } = {},
  ): Promise<T> {
    const token = await this.getAccessToken();
    if (!token) throw new Error("User must be signed in to call SLICE backend");

    const config = getSupabasePublicConfig();
    const url = new URL(`${config.functionsUrl}/${functionName}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      method: options.method ?? "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        apikey: config.anonKey,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new IntegrationError(
        "invalid_backend_response",
        "The SLICE backend returned an invalid response.",
        response.status,
      );
    }

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("ok" in payload) ||
      typeof payload.ok !== "boolean"
    ) {
      throw new IntegrationError(
        "invalid_backend_response",
        "The SLICE backend returned an invalid response.",
        response.status,
      );
    }

    if (!payload.ok) {
      if (
        !("error" in payload) ||
        typeof payload.error !== "object" ||
        payload.error === null ||
        !("code" in payload.error) ||
        typeof payload.error.code !== "string" ||
        !("message" in payload.error) ||
        typeof payload.error.message !== "string"
      ) {
        throw new IntegrationError(
          "invalid_backend_response",
          "The SLICE backend returned an invalid error response.",
          response.status,
        );
      }
      throw new IntegrationError(payload.error.code, payload.error.message, response.status);
    }

    if (!("data" in payload)) {
      throw new IntegrationError(
        "invalid_backend_response",
        "The SLICE backend returned an incomplete response.",
        response.status,
      );
    }
    return payload.data as T;
  }

  private parse<T>(schema: ZodType<T>, value: unknown): T {
    const result = schema.safeParse(value);
    if (!result.success) {
      throw new IntegrationError(
        "invalid_backend_response",
        "The SLICE backend returned data in an unexpected format.",
      );
    }
    return result.data;
  }

  profileUpsert(body: ProfileUpsertRequest) {
    return this.call("profile-upsert", { body });
  }

  listCreditors() {
    return this.call("creditors", { method: "GET" });
  }

  createCreditor(body: unknown) {
    return this.call("creditors", { body });
  }

  updateCreditor(body: unknown) {
    return this.call("creditors", { method: "PATCH", body });
  }

  deleteCreditor(id: string) {
    return this.call("creditors", { method: "DELETE", query: { id } });
  }

  async generateAiStrategy(creditorId: string): Promise<AiStrategyResponse> {
    const value = await this.call<unknown>("ai-strategy", { body: { creditor_id: creditorId } });
    return this.parse(AiStrategyResponseSchema, value);
  }

  async generateAiScript(
    creditorId: string,
    tone: "calm" | "firm" | "hardship" | "direct",
  ): Promise<AiScriptResponse> {
    const value = await this.call<unknown>("ai-script", { body: { creditor_id: creditorId, tone } });
    return this.parse(AiScriptResponseSchema, value);
  }

  sendZestMessage(message: string) {
    return this.call("zest-chat", { body: { message } });
  }

  syncEntitlements() {
    return this.call<{ tier: string; synced: boolean }>("entitlement-sync");
  }

  async requestCoaching(topic: string, notes?: string): Promise<CoachingBookingResponse> {
    const value = await this.call<unknown>("coaching-booking", { body: { topic, notes } });
    return this.parse(CoachingBookingResponseSchema, value);
  }

  exportData() {
    return this.call("data-export");
  }

  deleteAccount() {
    return this.call("account-delete");
  }

  getAggregateProgram() {
    return this.call<AggregateProgramResponse>("aggregate-program", { method: "GET" });
  }

  syncAggregateProgram(acceptDisclosure = false) {
    return this.call<AggregateProgramResponse>("aggregate-program", {
      body: { accept_disclosure: acceptDisclosure },
    });
  }

  toggleSavingsTrackerMonth(monthId: string, saved: boolean) {
    return this.call<AggregateProgramResponse>("aggregate-program", {
      method: "PATCH",
      body: { month_id: monthId, saved },
    });
  }
}

export function createSliceApiClient() {
  return new SliceApiClient(getCurrentAccessToken);
}
