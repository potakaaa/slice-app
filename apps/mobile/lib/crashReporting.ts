/**
 * Crash & error reporting (Pillar 2: Smooth User Experience).
 *
 * A single crash can turn a 5-star reviewer into a 1-star complaint, and a
 * crash you never hear about can never be fixed. This module is a thin,
 * vendor-agnostic seam: today it logs structured errors; wiring a real
 * backend (Sentry, Bugsnag, etc.) means filling in `initCrashReporting` and
 * `reportError` without touching any call site.
 *
 * To enable Sentry later:
 *   1. `npx expo install @sentry/react-native`
 *   2. In `initCrashReporting`: `Sentry.init({ dsn, enableNative: !__DEV__ })`
 *   3. In `reportError`: `Sentry.captureException(error, { extra: context })`
 */

import { useAppStore } from "@/store/useAppStore";

export type ErrorContext = Record<string, unknown> & {
  componentStack?: string;
  source?: string;
};

let initialized = false;

export function initCrashReporting(): void {
  if (initialized) return;
  initialized = true;

  // Catch otherwise-unhandled promise rejections so they surface in reports
  // instead of dying silently.
  const globalScope = globalThis as {
    onunhandledrejection?: ((event: { reason?: unknown }) => void) | null;
  };
  if (typeof globalScope.onunhandledrejection !== "undefined") {
    globalScope.onunhandledrejection = (event) => {
      const reason = event?.reason;
      const error = reason instanceof Error ? reason : new Error(String(reason));
      reportError(error, { source: "unhandledrejection" });
    };
  }
}

export function reportError(error: Error, context: ErrorContext = {}): void {
  if (!initialized) initCrashReporting();

  // A crash is a negative experience: suppress any review ask for a while so we
  // never follow a bad moment with "rate us". Skip errors that originate from
  // the review prompt itself to avoid a self-referential loop.
  if (context.source !== "reviewPrompt" && context.source !== "reviewPrompt.launch") {
    try {
      useAppStore.getState().recordNegativeSignal();
    } catch {
      // Never let signal-stamping break error reporting.
    }
  }

  // Structured, greppable log. Replace the body with a vendor call to ship
  // these off-device.
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.error("[crash]", error.message, { stack: error.stack, ...context });
  } else {
    // eslint-disable-next-line no-console
    console.error("[crash]", error.message, context);
  }
}
