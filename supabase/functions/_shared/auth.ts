import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { env } from "./env.ts";
import { HttpError } from "./errors.ts";

export type AuthedContext = {
  user: { id: string; email?: string };
  userClient: SupabaseClient;
  adminClient: SupabaseClient;
  token: string;
};

export function adminClient(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function anonClient(token: string): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireAuth(req: Request): Promise<AuthedContext> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!token) throw new HttpError(401, "unauthorized", "Missing bearer token");

  const admin = adminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "unauthorized", "Invalid or expired token");

  return {
    user: { id: data.user.id, email: data.user.email ?? undefined },
    userClient: anonClient(token),
    adminClient: admin,
    token,
  };
}

export function getClientInfo(req: Request) {
  return {
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: req.headers.get("user-agent") ?? null,
  };
}
