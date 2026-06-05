import { optionalEnv } from "./env.ts";

export function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  const allowed = (optionalEnv("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const allowOrigin = allowed.length === 0 || allowed.includes(origin) ? origin : allowed[0] ?? "";

  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, x-revenuecat-signature, x-slice-cron-secret",
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "vary": "origin",
  };
}

export function handleOptions(req: Request): Response | undefined {
  if (req.method !== "OPTIONS") return undefined;
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export async function withCors(
  req: Request,
  handler: () => Promise<Response>,
): Promise<Response> {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  const res = await handler();
  const headers = new Headers(res.headers);
  for (const [key, value] of Object.entries(corsHeaders(req))) headers.set(key, value);
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
