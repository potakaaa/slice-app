import { optionalEnv } from "./env.ts";

export async function createCalendlyBooking(input: {
  name: string;
  email: string;
  topic: string;
  notes?: string;
  priority: boolean;
}) {
  const apiKey = optionalEnv("CALENDLY_API_KEY");
  const eventType = optionalEnv("CALENDLY_EVENT_TYPE_URI");
  if (!apiKey || !eventType) {
    console.warn("calendly_skipped_missing_env");
    return { uri: null, startsAt: null, skipped: true };
  }

  // Calendly's public scheduling flow is normally invitee-driven. For MVP,
  // store a routing form link and metadata; replace this with one-off event
  // scheduling if the account enables that API flow.
  return {
    uri: eventType,
    startsAt: null,
    skipped: false,
    metadata: {
      topic: input.topic,
      priority: input.priority,
      notes: input.notes ?? "",
    },
  };
}
