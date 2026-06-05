import { getSupabasePublicConfig, type AccessTokenProvider } from "./supabase";

export type SliceApiSuccess<T> = { ok: true; data: T };
export type SliceApiError = { ok: false; error: { code: string; message: string } };
export type SliceApiResponse<T> = SliceApiSuccess<T> | SliceApiError;

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

    const payload = (await response.json()) as SliceApiResponse<T>;
    if (!payload.ok) {
      throw new Error(payload.error.message);
    }
    return payload.data;
  }

  profileUpsert(body: unknown) {
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

  generateAiStrategy(creditorId: string) {
    return this.call("ai-strategy", { body: { creditor_id: creditorId } });
  }

  generateAiScript(creditorId: string, tone: "calm" | "firm" | "hardship" | "direct") {
    return this.call("ai-script", { body: { creditor_id: creditorId, tone } });
  }

  sendZestMessage(message: string) {
    return this.call("zest-chat", { body: { message } });
  }

  syncEntitlements() {
    return this.call("entitlement-sync");
  }

  requestCoaching(topic: string, notes?: string) {
    return this.call("coaching-booking", { body: { topic, notes } });
  }

  exportData() {
    return this.call("data-export");
  }

  deleteAccount() {
    return this.call("account-delete");
  }
}
