/**
 * Milestone celebration copy (Pillar 3: Emotional Connection).
 *
 * SLICE users carry shame about debt; a warm, coach-like voice — "you took
 * action, we're proud of you, we're with you" — is a real differentiator. But
 * the same line repeated gets detected as canned, so each milestone has a small
 * pool of variants that NAME what the user did, and we rotate without repeating
 * the previous line (`nextCopyIndex`).
 *
 * Voice is explicit per milestone so reviewers can audit tone↔moment at a glance:
 *   - pride     → effort/courage moments ("so proud of you")
 *   - hero      → the once-in-a-journey debt-free peak
 *   - encourage → small steps (toast-length, light)
 *   - welcome   → purchases/upgrades (gratitude, NEVER pride — pride-after-
 *                 payment reads as manipulation)
 */

export type CelebrationTier = "micro" | "full" | "hero";
export type CelebrationVoice = "pride" | "hero" | "encourage" | "welcome";

export type MilestoneKey =
  | "m2_fund_setup"
  | "m3_first_creditor"
  | "m4_goal"
  | "m5_first_plan"
  | "m9_what_if"
  | "m13_logged_call"
  | "m14_added_fund"
  | "m15_follow_up"
  | "m16_ready"
  | "m17_settled"
  | "m19_debt_free"
  | "upgrade_silver"
  | "upgrade_gold"
  | "upgrade_platinum"
  | "coaching_booked";

interface CopyLine {
  title: string;
  message: string;
}

export interface MilestoneCopy extends CopyLine {
  tier: CelebrationTier;
  voice: CelebrationVoice;
}

interface MilestoneDef {
  tier: CelebrationTier;
  voice: CelebrationVoice;
  pool: CopyLine[];
}

/** The user's requested sentiment — appended to pride/hero messages. */
const SUPPORT_LINE = "We're here to support you every step of the way.";

const MILESTONES: Record<MilestoneKey, MilestoneDef> = {
  // --- T1 micro (encourage) -------------------------------------------------
  m2_fund_setup: {
    tier: "micro",
    voice: "encourage",
    pool: [
      { title: "Foundation set", message: "Your settlement fund is ready to grow." },
      { title: "Nice start", message: "That's the groundwork done — let's build on it." },
    ],
  },
  m4_goal: {
    tier: "micro",
    voice: "encourage",
    pool: [
      { title: "Goal locked in", message: "Now we'll tailor everything to get you there." },
      { title: "Direction set", message: "We know what you're aiming for — let's go." },
    ],
  },
  m9_what_if: {
    tier: "micro",
    voice: "encourage",
    pool: [
      { title: "Taking control", message: "Smart — you're seeing how the numbers move for you." },
      { title: "Good thinking", message: "Playing with the plan is how you find your fastest path." },
    ],
  },
  m15_follow_up: {
    tier: "micro",
    voice: "encourage",
    pool: [
      { title: "Momentum kept", message: "Follow-up set — that's how deals get closed." },
      { title: "Nice move", message: "Scheduling the next step keeps you in the driver's seat." },
    ],
  },

  // --- T2 full (pride) ------------------------------------------------------
  m3_first_creditor: {
    tier: "full",
    voice: "pride",
    pool: [
      { title: "First creditor added", message: "Honestly, that's the hardest part. We've got you from here." },
      { title: "You took the first step", message: "Naming what you owe takes courage. Proud of you." },
      { title: "Here we go", message: "One creditor at a time — and you just started." },
    ],
  },
  m5_first_plan: {
    tier: "full",
    voice: "pride",
    pool: [
      { title: "Your plan is ready", message: "You turned worry into a real, doable path." },
      { title: "Look at that", message: "A clear target and a date — you did that." },
    ],
  },
  m13_logged_call: {
    tier: "full",
    voice: "pride",
    pool: [
      { title: "You made the call", message: "Picking up the phone takes real guts. So proud of you." },
      { title: "That took courage", message: "You did the hard thing and negotiated. We're cheering you on." },
    ],
  },
  m14_added_fund: {
    tier: "full",
    voice: "pride",
    pool: [
      { title: "Fund growing", message: "Every dollar in is a dollar closer to your first offer." },
      { title: "Real momentum", message: "You're putting money where your goal is. Proud of you." },
    ],
  },
  m16_ready: {
    tier: "full",
    voice: "pride",
    pool: [
      { title: "Settlement-ready", message: "You saved enough to make a real offer. Look how far you've come." },
      { title: "You're ready", message: "Enough in the fund to make your move. Incredible work." },
    ],
  },
  m17_settled: {
    tier: "full",
    voice: "pride",
    pool: [
      { title: "Debt settled!", message: "One down — a debt resolved for less than you owed." },
      { title: "You settled it", message: "That's a real win you earned. So proud of you." },
    ],
  },

  // --- T3 hero --------------------------------------------------------------
  m19_debt_free: {
    tier: "hero",
    voice: "hero",
    pool: [
      { title: "You're debt-free!", message: "Every creditor settled. You finished the journey." },
      { title: "You did it", message: "Debt-free. We could not be prouder of you." },
    ],
  },

  // --- Gratitude (welcome — never pride) ------------------------------------
  upgrade_silver: {
    tier: "full",
    voice: "welcome",
    pool: [
      { title: "Welcome to Silver", message: "Unlimited AI strategy & scripts just unlocked. Thank you." },
    ],
  },
  upgrade_gold: {
    tier: "full",
    voice: "welcome",
    pool: [
      { title: "Welcome to Gold", message: "Live coaching and 1-on-1 with Marc are now yours. Thank you." },
    ],
  },
  upgrade_platinum: {
    tier: "full",
    voice: "welcome",
    pool: [
      { title: "Welcome to Platinum", message: "Done-with-you support is on. We'll be right beside you." },
    ],
  },
  coaching_booked: {
    tier: "full",
    voice: "welcome",
    pool: [
      { title: "Session booked", message: "A coach is in your corner now. Talk soon." },
    ],
  },
};

/**
 * Next rotation index for a pool, given the last-shown index. Pure so it can be
 * unit-tested. Never returns the previous index (unless the pool has one entry).
 */
export function nextCopyIndex(poolLength: number, lastIndex: number | undefined): number {
  if (poolLength <= 1) return 0;
  const last = lastIndex ?? -1;
  return (last + 1) % poolLength;
}

/**
 * Resolve the copy for a milestone at a given rotation index. Appends the
 * support line to pride/hero voices (the user's requested sentiment), and never
 * to encourage/welcome where it would feel tacked-on. Pure.
 */
export function resolveCopy(key: MilestoneKey, index: number): MilestoneCopy {
  const def = MILESTONES[key];
  const safeIndex = ((index % def.pool.length) + def.pool.length) % def.pool.length;
  const line = def.pool[safeIndex];
  const message =
    def.voice === "pride" || def.voice === "hero"
      ? `${line.message} ${SUPPORT_LINE}`
      : line.message;
  return { tier: def.tier, voice: def.voice, title: line.title, message };
}

/** Pool length for a milestone (used by the orchestrator to advance rotation). */
export function poolLength(key: MilestoneKey): number {
  return MILESTONES[key].pool.length;
}
