import * as StoreReview from "expo-store-review";
import Constants from "expo-constants";

import { reportError } from "@/lib/crashReporting";
import { useAppStore } from "@/store/useAppStore";

/**
 * In-app review prompt (Pillar 3: Emotional Connection).
 *
 * The native review sheet is requested only at a peak positive moment, and
 * only when the user has earned enough goodwill. We never prompt on errors,
 * empty states, or first launch, and never more than once per app version
 * (the OS additionally throttles how often the sheet actually appears).
 */

// Require at least this many positive moments before ever asking.
const MIN_HAPPY_MOMENTS = 1;

function currentVersion(): string {
  return Constants.expoConfig?.version ?? "unknown";
}

/**
 * Request a review if — and only if — the user is in a qualifying happy state.
 * Safe to call from any celebration; all gating lives here.
 *
 * @returns true if the native prompt was requested.
 */
export async function maybeRequestReview(): Promise<boolean> {
  try {
    const state = useAppStore.getState();

    // Gate 1: earned enough goodwill.
    if (state.happyMomentCount < MIN_HAPPY_MOMENTS) return false;

    // Gate 2: never ask twice for the same shipped version.
    const version = currentVersion();
    if (state.reviewPromptedVersion === version) return false;

    // Gate 3: platform must support and allow the native prompt.
    const available = await StoreReview.isAvailableAsync();
    if (!available) return false;
    const hasAction = await StoreReview.hasAction();
    if (!hasAction) return false;

    // Mark before requesting so a re-render or quick re-trigger can't double-fire.
    state.markReviewPrompted(version);
    await StoreReview.requestReview();
    return true;
  } catch (error) {
    reportError(error instanceof Error ? error : new Error(String(error)), {
      source: "reviewPrompt",
    });
    return false;
  }
}
