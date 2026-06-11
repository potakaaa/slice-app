import {
  type MilestoneKey,
  nextCopyIndex,
  poolLength,
  resolveCopy,
} from "@/lib/celebrationCopy";
import { useAppStore } from "@/store/useAppStore";
import { useCelebrationStore } from "@/store/useCelebrationStore";

interface CelebrateOptions {
  /**
   * Fire at most once, ever. Pass `true` to dedupe on the milestone key, or a
   * string to dedupe on a specific entity (e.g. `"m16_ready:<creditorId>"` so
   * each creditor reaching ready celebrates exactly once).
   */
  once?: boolean | string;
}

/**
 * Single entry point screens call to celebrate a milestone. Picks the next
 * non-repeating copy variant, advances the persisted rotation, and hands a
 * fully-resolved celebration to the root host. All tier/voice/copy logic lives
 * upstream so call sites stay one line.
 *
 * @returns true if a celebration was shown (false if deduped away).
 */
export function celebrate(key: MilestoneKey, options: CelebrateOptions = {}): boolean {
  const { once } = options;

  if (once) {
    const dedupeKey = typeof once === "string" ? once : key;
    // markMilestoneCelebrated returns false if already recorded.
    if (!useAppStore.getState().markMilestoneCelebrated(dedupeKey)) return false;
  }

  const appState = useAppStore.getState();
  const lastIndex = appState.celebrationCopyIndex[key];
  const index = nextCopyIndex(poolLength(key), lastIndex);
  appState.setCelebrationCopyIndex(key, index);

  const copy = resolveCopy(key, index);
  useCelebrationStore.getState().show({
    tier: copy.tier,
    voice: copy.voice,
    title: copy.title,
    message: copy.message,
  });
  return true;
}
