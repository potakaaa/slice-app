export function stripSensitive(input: string): string {
  return input
    .replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, "[redacted-ssn]")
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[redacted-card-or-account]")
    .replace(/password\s*[:=]\s*\S+/gi, "password=[redacted]")
    .slice(0, 8000);
}

export function sanitizeObject<T>(value: T): T {
  if (typeof value === "string") return stripSensitive(value) as T;
  if (Array.isArray(value)) return value.map((item) => sanitizeObject(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, sanitizeObject(val)]),
    ) as T;
  }
  return value;
}

export function safePromptJson(value: unknown): string {
  return stripSensitive(JSON.stringify(sanitizeObject(value), null, 2));
}
