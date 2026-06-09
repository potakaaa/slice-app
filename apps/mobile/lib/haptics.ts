import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Thin, crash-safe wrappers around expo-haptics.
 *
 * Pillar 3 (Emotional Connection): tactile feedback at meaningful moments.
 * Haptics are a no-op on web and must never throw into a render/press path,
 * so every call is guarded and swallowed.
 */

const enabled = Platform.OS === "ios" || Platform.OS === "android";

function safe(run: () => Promise<unknown>): void {
  if (!enabled) return;
  // Fire-and-forget; a failed haptic should never break an interaction.
  run().catch(() => {});
}

/** Light tap — primary CTAs, selections, confirmations. */
export function hapticLight(): void {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Medium tap — a slightly weightier action (e.g. status change). */
export function hapticMedium(): void {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Selection tick — moving through segmented options. */
export function hapticSelection(): void {
  safe(() => Haptics.selectionAsync());
}

/** Success notification — accomplishments, celebrations. */
export function hapticSuccess(): void {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Warning notification — recoverable problems. */
export function hapticWarning(): void {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}
