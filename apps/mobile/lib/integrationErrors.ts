export class IntegrationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
    public readonly cancelled = false,
  ) {
    super(message);
    this.name = "IntegrationError";
  }
}

const messages: Record<string, string> = {
  ai_provider_error: "The AI service is temporarily unavailable. Please try again.",
  rate_limit_exceeded: "You have reached today's AI limit for your plan.",
  tier_required: "This feature requires a higher subscription tier.",
  creditor_not_found: "This creditor could not be found. Refresh and try again.",
  revenuecat_not_configured: "Purchases are not configured for this build.",
  revenuecat_preview: "Real purchases require an iOS or Android development build.",
  offering_unavailable: "Subscription products are currently unavailable.",
  package_unavailable: "This subscription plan is not available from the store.",
  management_unavailable: "No store subscription management link is available.",
  scheduling_unavailable: "Online scheduling is unavailable. The coaching team will follow up by email.",
};

export function integrationMessage(error: unknown, fallback: string): string {
  if (error instanceof IntegrationError) {
    return messages[error.code] ?? error.message ?? fallback;
  }
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

export function toIntegrationError(error: unknown, fallbackCode: string, fallbackMessage: string) {
  if (error instanceof IntegrationError) return error;

  const candidate = error as {
    code?: string | number;
    message?: string;
    userCancelled?: boolean;
  } | null;
  const cancelled = Boolean(candidate?.userCancelled);
  return new IntegrationError(
    cancelled ? "purchase_cancelled" : String(candidate?.code ?? fallbackCode),
    candidate?.message ?? fallbackMessage,
    undefined,
    cancelled,
  );
}
