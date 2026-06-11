# PLAN: Tiered Milestone Celebrations — Supportive "We're Proud of You" Moments

**Date:** 2026-06-10
**Type:** MEDIUM (1 new component + 1 copy module + ~7 trigger sites + store guard reuse)
**Status:** EXECUTED (2026-06-10) — code-complete; typecheck clean, 39/39 unit tests pass
(9 new copy-rotation tests). On-device QA pending (Reduce-Motion + visual timing).

> **Execution deviations from plan (all intentional):**
> 1. **Architecture:** built a single root-mounted `CelebrationHost` + transient
>    `useCelebrationStore` + `celebrate()` orchestrator instead of per-screen `ToastProvider`/
>    overlays — required because `add-to-fund` and onboarding steps navigate away, which would
>    unmount a local overlay. This also centralizes "highest-tier-wins" and the
>    celebration→review sequence in one place.
> 2. **Review sequencing centralized:** removed the per-screen `setTimeout(maybeRequestReview)`
>    from the settle/log-call screens; the host now fires the (independently gated) review ask
>    after any pride/hero celebration dismisses.
> 3. **M21–M23 upgrades:** left `pricing.tsx`'s existing tier-specific celebration as-is — it is
>    already welcome-toned ("Silver Unlocked!" + benefits), uses no pride language, and never
>    triggers the review prompt. Welcome copy keys exist in `celebrationCopy.ts` for future use.
> 4. **M24 coaching-booked:** WIRED — `celebrate("coaching_booked", { once: true })` fires on a
>    successful booking in `coaching.tsx` (welcome voice; no review ask). The call is placed
>    **after** `await WebBrowser.openBrowserAsync(...)`, so when Calendly opens the confetti
>    plays on the success card the user returns to (not behind the browser); with no scheduling
>    URL it plays immediately over the success card.
> 5. **once-only fires:** M9/M13/M14/M15 use `{ once: true }` so routine repeats stay quiet.
**App:** `apps/mobile` (SLICE — debt-settlement / snowball / credit-repair)
**Owner:** UI/UX
**Source of truth for milestones:** `docs/user-milestones.md` (M1–M25)
**Sibling work:** `process/general-plans/active/2026-06-09-review-worthy-ux.md` (Pillar 3),
in-app review timing (`process/features/app-store-readiness/active/REVIEW_PROMPT_TIMING_UX_PLAN_10-06-26.md`)

> User intent: add a warm, supportive celebration ("congratulations for taking action, we are
> so proud of you — we're here every step of the way") to milestone moments, with **variations**
> so it never feels canned. UX decision (approved): **tier** the celebrations instead of firing
> the same confetti on all 25 — match intensity to effort/significance, and use the right *voice*
> per milestone type.

---

## 1. Objective

Make SLICE feel like a coach who genuinely cares — especially powerful in a debt app where users
carry shame — **without** diluting the big wins (settled, debt-free) through celebration inflation
or mis-toning passive/paywall/purchase moments.

### Design principles (the "warm but not exhausting" contract)
1. **Intensity matches effort.** Full confetti for courage moments; a quiet toast for small steps;
   nothing for passive views or hitting a paywall.
2. **Right voice per type.** "Proud of you for taking action" = *effort* moments only. Purchases
   get a **gratitude/welcome** voice, never pride (pride-after-payment reads as manipulation).
3. **Variation that names the act.** Copy rotates from a per-milestone pool and references *what
   they did* — generic praise repeated is detected as canned.
4. **Once per milestone.** Reuse `markMilestoneCelebrated(key)`; never re-celebrate the 2nd creditor.
5. **Never stack.** A celebration and the review prompt can't both fire on the same beat; passive
   milestones never interrupt.
6. **Accessible.** Honor reduce-motion (skip confetti, keep the message), auto-dismiss, tap-to-dismiss,
   optional haptics.

---

## 2. The tier model (mapped to `docs/user-milestones.md`)

| Tier | Treatment | Voice | Milestones |
|------|-----------|-------|------------|
| **T0 — Silent / subtle** | no popup; at most an inline ✓ already present | — | M1 welcome, M7 viewed readiness card, M8 saw savings target, M10 identified first creditor, **M20 paywall** |
| **T1 — Micro** | new `Toast` (bottom, ~2.2s, slide+fade) + `hapticLight` | encouraging, light | M2 fund set up, M4 goal chosen, M9 ran what-if, M15 follow-up set |
| **T2 — Full** | existing `CelebrationOverlay` (confetti) + supportive copy | **pride / "proud of you"** | M3 first creditor, M5 first plan, M13 logged a call, M14 added to fund, M16 settlement-ready *(M17 settled already wired)* |
| **T3 — Hero** | `CelebrationOverlay` in a distinct `variant="hero"` (more confetti, longer, share CTA) | pride + awe | **M19 debt-free** |
| **Gratitude** | keep existing upgrade confetti (`pricing.tsx`) | **welcome / thank-you** | M21 Silver, M22 Gold, M23 Platinum, M24 coaching booked |

> Why M16 is careful: it's a *state transition* (`calcSettlementReadiness` → `"ready"`), not a tap.
> Fire only on the first crossing into `ready`, guarded by `markMilestoneCelebrated("ready:<creditorId>")`.

---

## 3. Copy system (variations that don't get boring)

New module `apps/mobile/lib/celebrationCopy.ts`:

```ts
type CelebrationVoice = "pride" | "encourage" | "welcome" | "hero";
interface CelebrationCopy { title: string; message: string; }

// Per-milestone pools. pickCelebration() rotates and never returns the
// last-shown line for that key (tracked in-memory + persisted lastCopyIndex).
export function pickCelebration(key: MilestoneKey): CelebrationCopy;
```

**Pools (initial; 3 variants each so it rotates):**

- **M3 first creditor** (pride)
  - "First creditor added — honestly the hardest part. We've got you from here."
  - "You just took the first real step. Proud of you. We're with you the whole way."
  - "That's the bravest part done. One creditor at a time — we're right beside you."
- **M5 first plan** (pride)
  - "Your plan is ready. You turned worry into a real, doable path. So proud of you."
  - "Look at that — a clear target and a date. You did that. We're here every step."
- **M13 logged a call** (pride)
  - "You picked up the phone and negotiated. That takes real guts. So proud of you."
  - "You did the hard thing — you made the call. We're cheering you on."
- **M14 added to fund** (pride)
  - "Every dollar in is a dollar closer. Real momentum now — proud of you."
- **M16 settlement-ready** (pride)
  - "You saved enough to make a real offer. Look how far you've come. We're with you."
- **M19 debt-free** (hero)
  - "You did it. Every creditor settled. You're debt-free. We could not be prouder of you."
- **M2 / M4 / M9 / M15** (encourage, short, toast-length)
  - M2: "Nice — that's the foundation set." / M4: "Goal locked in. Let's get you there."
  - M9: "Smart — you're taking control of the numbers." / M15: "Follow-up set. Momentum kept."
- **M21–M24 upgrades** (welcome — NOT pride)
  - M21: "Welcome to Silver — unlimited AI strategy & scripts just unlocked. Thank you."
  - (Gold/Platinum/coaching analogous welcome lines.)

**Closing line** (the user's requested sentiment) appended to pride/hero messages where it fits:
"We're here to support you every step of the way."

**No-repeat rule:** store `celebrationCopyIndex: Record<string, number>` (persisted) so the rotation
survives app restarts; pick `(lastIndex + 1) % pool.length`.

---

## 4. Touchpoints

| File | Change |
|------|--------|
| `components/Toast.tsx` *(new)* | Lightweight bottom toast: message, optional haptic, auto-dismiss ~2.2s, reduce-motion aware, accessible (role=alert). A `ToastProvider` + `useToast()` mounted near root. |
| `lib/celebrationCopy.ts` *(new)* | Milestone keys, copy pools, `pickCelebration()` with no-repeat rotation. |
| `components/CelebrationOverlay.tsx` | Add `variant?: "standard" \| "hero"` (hero = more pieces, longer `VISIBLE_MS`, optional share CTA). Add reduce-motion: skip confetti, keep badge+message. |
| `store/useAppStore.ts` | Add `celebrationCopyIndex: Record<string, number>` + `bumpCelebrationCopy(key)`; persist. (Reuse existing `markMilestoneCelebrated`, `recordHappyMoment`.) |
| `app/_layout.tsx` | Mount `ToastProvider` inside providers so any screen can `useToast()`. |
| `app/onboarding/step1.tsx` (M2), `step2.tsx` (M3), `step3.tsx` (M4), `complete.tsx` (M5) | Fire correct tier on completion. M3 + M5 = T2 confetti; M2 + M4 = T1 toast. Guard with `markMilestoneCelebrated`. |
| `app/what-if.tsx` (M9) | First meaningful interaction → T1 toast (once). |
| `app/add-to-fund.tsx` (M14) | On successful `upsertProfile` → T2 confetti + `recordHappyMoment(1)` before `router.back()`. |
| `app/creditor/log-call/[id].tsx` (M15) | When a follow-up date is set (non-`none`) without a settle → T1 toast. (Settle path already T2.) |
| Readiness surface — `components/SettlementReadinessCard.tsx` or `app/(tabs)/index.tsx` (M16) | Detect first transition to `status: "ready"` per creditor → T2 confetti, guarded by `markMilestoneCelebrated("ready:<id>")`. |
| `app/creditor/[id].tsx` (M17), `pricing.tsx` (upgrades) | M17 already T2 (keep). Upgrades: keep confetti, swap copy to **welcome** voice via `pickCelebration`. |

**Explicitly unchanged (T0):** M1, M7, M8, M10, M20 — no celebration added.

---

## 5. Interaction & sequencing rules
- **Celebration before review.** Where a T2/T3 celebration and a review ask can co-occur (M13/M16/
  M17/M19), the review prompt stays on its existing delayed `onDone` path — it only fires *after*
  the celebration dismisses. No new collision risk.
- **One celebration per beat.** If two milestones would fire from one action (e.g., M17 settle that
  is also M19 debt-free), show only the **highest tier** (T3 hero wins).
- **Toast vs overlay never simultaneously** for the same action.
- **Reduce-motion:** confetti suppressed app-wide via `AccessibilityInfo.isReduceMotionEnabled()`;
  the supportive message + haptic still play so the emotional beat survives.

---

## 6. Verification
- **Typecheck:** `pnpm -s typecheck` clean.
- **Unit (pure, matches repo convention — no native imports):**
  - `lib/celebrationCopy.test.ts` — `pickCelebration` never returns the same index twice in a row;
    cycles the full pool; returns correct voice per key; appends the support line only to pride/hero.
- **Manual (device / Expo):**
  1. Fresh onboarding → M2 toast, M3 confetti, M4 toast, M5 confetti — correct copy, no repeats.
  2. Add to fund → confetti + happy moment recorded.
  3. Drive a creditor to `ready` → single confetti; revisiting home does **not** re-fire.
  4. Settle the last creditor → **hero** plays (not standard), debt-free copy.
  5. Upgrade → confetti with **welcome** copy, not "proud of you."
  6. Enable Reduce Motion → no confetti, message + haptic still show.
  7. Visit M7/M20 → nothing fires.

---

## 7. Risks & mitigations
- **Over-celebration creep later:** the tier map + copy pools are centralized in `celebrationCopy.ts`,
  so adding/removing a milestone is a data edit, not new UI wiring.
- **State-transition double-fire (M16):** strictly guarded by per-creditor `markMilestoneCelebrated`.
- **Tone drift:** voice is an explicit field per pool; reviewers can audit voice↔milestone at a glance.
- **Onboarding feeling heavy:** only M3 + M5 get full confetti in onboarding; M2/M4 are quick toasts,
  so the 4-step flow isn't four full-screen takeovers.

---

## 8. Out of scope
- Sound effects.
- Server-driven / remote-config copy (pools are local for now).
- Share-sheet implementation for the hero CTA (button can be stubbed/deferred unless desired).
- Re-celebrating repeat actions (2nd creditor, subsequent settlements beyond debt-free).

---

## 9. Resume handoff
- **Next action if approved:** ENTER EXECUTE MODE → implement §4 in order
  (Toast + copy module + store field → wire triggers → CelebrationOverlay hero/reduce-motion).
- **Tuning lives in:** `lib/celebrationCopy.ts` (pools + voice) and the tier map (§2).
- **Done =** typecheck clean, `celebrationCopy` unit tests green, all §6 manual cases pass on device,
  no T0 milestone fires anything.
