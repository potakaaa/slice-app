import { optionalEnv } from "./env.ts";

export function getCalendlyScheduling(input: {
  topic: string;
  notes?: string;
  priority: boolean;
}) {
  const schedulingUrl = optionalEnv("CALENDLY_SCHEDULING_URL");
  if (!schedulingUrl) {
    console.warn("calendly_skipped_missing_env");
    return { url: null, available: false };
  }

  const url = new URL(schedulingUrl);
  url.searchParams.set("a1", input.topic);
  if (input.notes) url.searchParams.set("a2", input.notes.slice(0, 500));
  if (input.priority) url.searchParams.set("a3", "priority");

  return {
    url: url.toString(),
    available: true,
  };
}
