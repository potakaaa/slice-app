import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

async function sha256(value: string | null): Promise<string | null> {
  if (!value) return null;
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function auditLog(
  client: SupabaseClient,
  input: {
    userId?: string | null;
    actorType?: string;
    action: string;
    severity?: "info" | "warning" | "critical";
    ip?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const { error } = await client.from("audit_security_logs").insert({
    user_id: input.userId ?? null,
    actor_type: input.actorType ?? "user",
    action: input.action,
    severity: input.severity ?? "info",
    ip_hash: await sha256(input.ip ?? null),
    user_agent: input.userAgent ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) console.error("audit_log_failed", error);
}
