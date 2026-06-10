import { optionalEnv } from "./env.ts";

export async function sendExpoPush(messages: Array<{ to: string; title: string; body: string; data?: Record<string, unknown> }>) {
  if (messages.length === 0) return { sent: 0 };
  const token = optionalEnv("EXPO_ACCESS_TOKEN");
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(messages),
  });
  if (!res.ok) console.error("expo_push_error", res.status, (await res.text()).slice(0, 500));
  return { sent: messages.length, status: res.status };
}
