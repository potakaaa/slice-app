import * as StoreReview from "expo-store-review";
import Constants from "expo-constants";

import { reportError } from "@/lib/crashReporting";
import { useAppStore } from "@/store/useAppStore";

/**
 * In-app review prompt (Pillar 3: Emotional Connection).
 *
 * The native review sheet is a scarce, OS-throttled resource (iOS shows it at
 * most ~3x/365 days and may silently no-op). We treat every prompt as a
 * one-shot privilege and spend it only when the moment is safe — never on
 * errors, empty states, or right after a bad experience, and never more than
 * once per app version. Two entry points share the same safety gates:
 *
 *   - maybeRequestReview()         fired at a peak win (settled / debt-free).
 *   - maybeRequestReviewOnLaunch() fired early, on the 2nd or 3rd app open.
 *
 * All gating lives here so call sites stay dumb and safe.
 */

// --- Tunable thresholds (single source of truth) ------------------------------
/** Earned-win path: minimum days since first launch before asking. */
const MIN_INSTALL_AGE_DAYS = 3;
/** Earned-win path: minimum app opens before asking. */
const MIN_SESSIONS = 3;
/** Earned-win path: weighted goodwill score required to ask. */
const MIN_HAPPY_SCORE = 3;
/** Any path: minimum days between two prompts, across versions. */
const GLOBAL_COOLDOWN_DAYS = 60;
/** Any path: suppress prompts for this long after a negative signal. */
const NEGATIVE_SUPPRESS_DAYS = 7;
/** Launch path: only fire on these app-open counts (the "2nd or 3rd open"). */
const LAUNCH_PROMPT_SESSIONS = [2, 3];
// ------------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

function currentVersion(): string {
  return Constants.expoConfig?.version ?? "unknown";
}

function daysSince(timestamp: number | null): number {
  if (timestamp == null) return Number.POSITIVE_INFINITY;
  return (Date.now() - timestamp) / DAY_MS;
}

type AppState = ReturnType<typeof useAppStore.getState>;

/**
 * Safety gates shared by every path. These never make us *more* likely to ask;
 * they only protect the user from being asked at a bad time or too often.
 */
async function passesSafetyGates(state: AppState): Promise<boolean> {
  // Never ask twice for the same shipped version.
  if (state.reviewPromptedVersion === currentVersion()) return false;

  // Honor a global cooldown so frequent releases can't re-ask every version.
  if (daysSince(state.lastPromptAt) < GLOBAL_COOLDOWN_DAYS) return false;

  // Never ask right after a bad experience (crash / failed payment / support).
  if (daysSince(state.lastNegativeSignalAt) < NEGATIVE_SUPPRESS_DAYS) return false;

  // Platform must support and currently allow the native sheet.
  if (!(await StoreReview.isAvailableAsync())) return false;
  if (!(await StoreReview.hasAction())) return false;

  return true;
}

/**
 * Commit (mark before requesting so a re-render can't double-fire) and request.
 * Returns true if the native prompt was requested.
 */
async function commitAndRequest(state: AppState): Promise<boolean> {
  state.markReviewPrompted(currentVersion());
  await StoreReview.requestReview();
  return true;
}

/**
 * Earned-win path. Request a review only when the user has accumulated real
 * goodwill (install age + sessions + weighted happy score) and all safety gates
 * pass. Safe to call from any celebration's "done" handler.
 *
 * @returns true if the native prompt was requested.
 */
export async function maybeRequestReview(): Promise<boolean> {
  try {
    const state = useAppStore.getState();

    // Goodwill gates — the user has used the app and felt repeated success.
    if (daysSince(state.firstLaunchAt) < MIN_INSTALL_AGE_DAYS) return false;
    if (state.sessionCount < MIN_SESSIONS) return false;
    if (state.happyMomentCount < MIN_HAPPY_SCORE) return false;

    if (!(await passesSafetyGates(state))) return false;
    return await commitAndRequest(state);
  } catch (error) {
    reportError(error instanceof Error ? error : new Error(String(error)), {
      source: "reviewPrompt",
    });
    return false;
  }
}

/**
 * Launch path. Ask early — on the 2nd or 3rd app open — while still respecting
 * every safety gate (once-per-version, cooldown, no-recent-error, platform).
 * This deliberately skips the install-age and happy-score gates so the ask can
 * land early, but the safety gates guarantee it can never become a nag.
 *
 * @returns true if the native prompt was requested.
 */
export async function maybeRequestReviewOnLaunch(): Promise<boolean> {
  try {
    const state = useAppStore.getState();

    // Only the configured early opens are eligible.
    if (!LAUNCH_PROMPT_SESSIONS.includes(state.sessionCount)) return false;

    if (!(await passesSafetyGates(state))) return false;
    return await commitAndRequest(state);
  } catch (error) {
    reportError(error instanceof Error ? error : new Error(String(error)), {
      source: "reviewPrompt.launch",
    });
    return false;
  }
}
