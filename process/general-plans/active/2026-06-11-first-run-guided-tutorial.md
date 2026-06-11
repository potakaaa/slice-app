# PLAN: First-Run Guided Tutorial (Optional, Opt-In)

**Date:** 2026-06-11
**Type:** MEDIUM (1 feature, ~6 new files + 4 touch points)
**Status:** EXECUTED (2026-06-11) — code-complete; typecheck clean + 39/39 unit tests pass.
**On-device QA pending** (spotlight measurement + welcome-sheet modal on simulator/device).
**App:** `apps/mobile` (SLICE — debt-settlement / snowball / credit-repair)

> **Execution outcome:** all planned files shipped. Animation uses React Native's built-in
> `Animated` (not Reanimated) — simpler, zero worklet risk. Tutorial state is local-only
> (store `tutorialStatus`, persisted with a new `version:1` migration that defaults existing
> installs to `skipped`); the Supabase `tutorial_completed_at` sync stays deferred (§7).
>
> **Revision (2026-06-11, post-review):** per user direction the tour was reworked from a
> passive Next-button walkthrough into an **interactive, tab-driven tour** (chosen approach:
> "arrow + auto-navigate" — native tab bars left untouched). The overlay now darkens the
> screen, spotlights the **next tab** with a cut-out + bouncing "Tap X" arrow chip, and shows a
> message about the current tab; tapping the highlighted tab (the overlay's own hotspot drives
> `router.navigate`, so it works under both the classic and liquid-glass bars) navigates and
> advances. The element-measurement path (`useTourTarget`, `home.*` content targets) was removed
> as no longer needed. **Known limitation:** on iOS 26+ the native liquid-glass bar can render
> above the JS overlay, so taps can't be hard-gated to one tab there — the arrow still guides;
> confirm on-device.

---

## 1. Objective

Give brand-new users a **fully optional**, opt-in guided tour the first time they land in the
app after sign-up. It walks them step-by-step ("here's your dashboard → here's where your
creditors live → here's your program → here are the tools → here's the AI guidance"), and they
can **opt in or out at any moment** — accept, skip, or dismiss without penalty. It must feel
helpful, never trapping or naggy.

### UX principles (the bar this is held to)

1. **Opt-in, never forced.** First-run users see a friendly, dismissible welcome prompt:
   _"Want a 30-second tour?"_ → **Show me** / **Skip**. No dark patterns; **Skip** is equally
   prominent.
2. **Escapable at every step.** A persistent **Skip tour** (and **✕**) is visible on every
   coach mark. Backdrop tap never traps; nothing blocks core actions permanently.
3. **Show, don't lecture.** Short copy (≤ 2 lines per step), one idea per step, real UI
   highlighted with a spotlight, not a wall of text.
4. **Respect the user's state.** Honors reduce-motion, supports screen readers (focus moves to
   each step, labelled controls), and never re-shows once completed or skipped.
5. **Re-discoverable.** Anyone can replay it later from **More → Replay app tour**, so opting
   out is risk-free.
6. **Quietly resumable.** If the user closes the app mid-tour, it doesn't aggressively reappear;
   it returns to the dismissible welcome state.

---

## 2. Current State (discovered)

| Area | Finding | File(s) |
|---|---|---|
| Post-signup entry | `onboarding/complete.tsx` `handleStart()` persists profile + creditors, then `router.replace("/(tabs)")`. This is the exact hand-off into the app — the natural tutorial trigger point. | `app/onboarding/complete.tsx:69-105` |
| Home dashboard | First screen users see. Renders `SummaryCard`, `SettlementReadinessCard`, `CreditorCard`s, `TierBadge`. Good first spotlight targets. | `app/(tabs)/index.tsx` |
| Tab bar | 5 tabs: Home / Creditors / Program / Tools / More. Two layouts: `NativeTabs` (liquid glass) and classic `Tabs`. Tour copy can _name_ tabs; spotlighting the native tab bar itself is not reliable across both layouts. | `app/(tabs)/_layout.tsx` |
| State store | Zustand + `persist` (AsyncStorage). Already holds onboarding/celebration flags and a `markMilestoneCelebrated` dedupe pattern — natural home for tutorial status. | `store/useAppStore.ts:1-80` |
| Profile model | `UserProfile` has `onboardingComplete: boolean`; persisted locally and upserted to Supabase via `useUpsertProfile`. No tutorial field yet. | `apps/mobile/types/index.ts:6-19`, `lib/sliceData` |
| Delight conventions | `celebrate()` + `expo-haptics` already establish the app's tone (warm, light haptics, no-repeat copy rotation). Tour step transitions should reuse light haptics for consistency. | `lib/celebrate.ts`, `store/useCelebrationStore.ts` |
| More menu | Declarative `MENU_GROUPS` list of routed rows — clean place to add a "Replay app tour" entry (as an action, not a route). | `app/(tabs)/more.tsx:25-60` |
| Animation dep | `react-native-reanimated@~4.1.1` already installed and used by celebrations — spotlight/tooltip fade can reuse it. **No new dependency required.** | `package.json` |

**Net gap:** there is zero in-app guidance after sign-up. New users are dropped onto the
dashboard cold. No tutorial state, no replay affordance, no opt-in prompt.

---

## 3. Approach (chosen)

A small, self-contained **Tour engine** mounted once at the tabs root, driven by a declarative
step list, plus an **opt-in welcome sheet** and a **persisted status flag**. Offline-first
(local store is source of truth); Supabase sync is a thin, best-effort add-on.

**Why this shape:** keeps blast radius to one provider + overlay + a few registration hooks;
avoids a new dependency; degrades gracefully (if a target can't be measured, the step still
shows centered copy); and works under both tab layouts because spotlight targets are screen
_content_ refs, not the native tab bar.

**Scope decision (important):** v1 spotlights live targets **on the Home screen** and uses
**copy-only steps** to point users toward the other tabs ("Tap **Creditors** to manage who you
owe"). A true cross-tab spotlight that auto-navigates tabs is deferred to a follow-up (noted in
§7) to keep v1 tractable and robust.

---

## 4. Design Detail

### 4.1 Tutorial status (state)

Add to `useAppStore`:

```ts
type TutorialStatus = "pending" | "in_progress" | "completed" | "skipped";
tutorialStatus: TutorialStatus;            // default "pending"
setTutorialStatus: (s: TutorialStatus) => void;
startTour: () => void;                      // sets "in_progress"
```

- Persisted via existing `persist` middleware (add to the `partialize` allow-list if present).
- `pending` → welcome sheet is eligible to show. `skipped`/`completed` → never auto-shows.
- Set to `pending` explicitly when `onboarding/complete.tsx` hands off to `/(tabs)` (so only
  genuinely-new users enter the eligible state; existing users default-loaded from storage keep
  their prior value).

**Supabase sync (best-effort):** add optional `tutorialCompletedAt?: string | null` to
`UserProfile` and include it in the `useUpsertProfile` payload when the tour finishes/skips.
If the column doesn't exist server-side yet, treat the write as non-fatal (wrap, swallow,
local store remains source of truth). Flag a follow-up migration in §7 rather than blocking v1.

### 4.2 Components (new — under `apps/mobile/components/tour/`)

| File | Responsibility |
|---|---|
| `TourProvider.tsx` | React context: holds `activeStepIndex`, registered target rects, and controls (`start`, `next`, `prev`, `skip`, `finish`). Reads/writes `tutorialStatus`. Exposes `useTour()`. |
| `TourOverlay.tsx` | The portal rendered above all content: dimmed backdrop with a spotlight cut-out over the active target, plus a tooltip card (title, body, progress "2 of 5", **Back** / **Next** / **Skip tour** / ✕). Auto-flips tooltip above/below based on target position; falls back to centered card when no target. Reanimated fade; respects reduce-motion. |
| `useTourTarget.ts` | Hook screens use to register a spotlightable element: `const ref = useTourTarget("home.summary")`. Measures via `measureInWindow` on layout/scroll; reports rect to provider. No-op when tour inactive. |
| `tourSteps.ts` | Declarative step config array: `{ id, targetId?, title, body, placement? }`. Single source of truth for tour content + ordering. |
| `TourWelcomeSheet.tsx` | The opt-in entry: a non-blocking bottom sheet — _"Welcome to SLICE 👋 Want a quick 30-second tour?"_ with **Show me the tour** (primary) and **Skip for now** (equally legible). Dismiss = treated as "skip for now" (status → `skipped`, but replayable). |
| `index.ts` | Barrel exports. |

### 4.3 Step content (v1 — `tourSteps.ts`)

1. **Welcome / dashboard** → target `home.summary` — _"This is your dashboard — your debt, settlement target, and savings at a glance."_
2. **Settlement readiness** → target `home.readiness` — _"We'll tell you when you're ready to make your first offer."_
3. **Your creditors** → copy-only — _"Tap the **Creditors** tab to add or manage who you owe."_
4. **Your program** → copy-only — _"The **Program** tab shows your snowball payoff plan, step by step."_
5. **AI guidance** → copy-only — _"Open **Tools** for AI negotiation scripts tailored to each creditor."_
6. **Done** → centered card — _"That's it! Replay anytime from **More → Replay app tour**."_ → **Finish** sets `completed`.

(Exact copy is editable in one file; keep each ≤ 2 lines.)

### 4.4 Wiring / touch points (edits)

1. **`app/(tabs)/_layout.tsx`** — wrap the returned layout in `<TourProvider>` and render
   `<TourOverlay />` once at the root so it floats above all tabs. (Wrap inside the existing
   default export so both native + classic layouts get it.)
2. **`app/(tabs)/index.tsx`** — attach `useTourTarget("home.summary")` /
   `("home.readiness")` refs to the summary + readiness cards; on mount, if
   `tutorialStatus === "pending"`, render `<TourWelcomeSheet />`.
3. **`app/onboarding/complete.tsx`** — in `handleStart()`, set `tutorialStatus = "pending"`
   right before/after `router.replace("/(tabs)")` so first-run users become tour-eligible.
4. **`app/(tabs)/more.tsx`** — add a "Replay app tour" row (an action calling `startTour()`,
   not a route) under a suitable group (e.g. a new "Help" group or within "Account").
5. **`store/useAppStore.ts`** — add `tutorialStatus` + actions (§4.1).
6. **`apps/mobile/types/index.ts`** — add optional `tutorialCompletedAt` to `UserProfile`.

### 4.5 Accessibility & polish checklist

- [ ] `accessibilityViewIsModal` on the overlay; focus moves to each step's tooltip.
- [ ] Every control has an `accessibilityLabel` / `accessibilityRole="button"`.
- [ ] Honor `AccessibilityInfo.isReduceMotionEnabled()` → disable fade/scale, instant cuts.
- [ ] Spotlight + tooltip contrast meets WCAG AA on the orange gradient and on dark mode.
- [ ] Light `expo-haptics` tick on step advance (matches existing tone); none on reduce-motion.
- [ ] Safe-area aware; tooltip never clips under the tab bar or notch.
- [ ] Skip and ✕ reachable at every step; backdrop tap does **not** advance or trap.

---

## 5. Files Summary (blast radius)

**New (6):** `components/tour/{TourProvider,TourOverlay,TourWelcomeSheet}.tsx`,
`components/tour/{useTourTarget.ts,tourSteps.ts,index.ts}`

**Edited (4):** `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/more.tsx`,
`app/onboarding/complete.tsx`, plus `store/useAppStore.ts` and `types/index.ts`.

No new dependencies. No schema-breaking change (Supabase column is additive + best-effort).

---

## 6. Verification

- [ ] **Typecheck** clean (`pnpm -C apps/mobile typecheck` or repo equivalent).
- [ ] **Fresh sign-up** → land on Home → welcome sheet appears once. **Skip** → never auto-reappears; **Show me** → 6-step tour runs with working Back/Next/Skip and progress.
- [ ] **Existing user** (storage has `completed`/`skipped`) → no welcome sheet on launch.
- [ ] **Replay** from More re-runs the full tour regardless of prior status.
- [ ] **Reduce-motion ON** → no animation, still fully navigable.
- [ ] **Screen reader** → each step is announced; controls are labelled; overlay is modal.
- [ ] **Both tab layouts** (liquid-glass `NativeTabs` and classic `Tabs`) render the overlay.
- [ ] Kill app mid-tour → relaunch → no aggressive re-prompt (returns to `skipped`/replayable).
- [ ] Existing onboarding + celebration flows unaffected.

---

## 7. Deferred / Follow-ups (out of v1 scope)

- **Cross-tab auto-navigation tour**: steps that programmatically switch tabs and spotlight an
  element on each (Creditors/Program/Tools). v1 uses copy-only pointers instead.
- **Supabase migration**: add `tutorial_completed_at` column + map in `lib/sliceData` so tour
  state syncs cross-device (v1 stores locally + writes best-effort).
- **Contextual micro-coachmarks**: one-time tips on first visit to each tab (separate from the
  global tour).
- **Analytics**: emit tour `started/step_viewed/skipped/completed` events for funnel tuning.

---

## 8. Resume Handoff

- **Status:** EXECUTED 2026-06-11. Typecheck clean, 39/39 unit tests pass.
- **Remaining before archive:** on-device QA — fresh sign-up → welcome sheet → 6-step tour
  (spotlight measurement on Home, reduce-motion, screen reader) → replay from More. Verify on
  both tab layouts (liquid-glass `NativeTabs` + classic `Tabs`).
- **Files shipped:** `components/tour/{TourProvider,TourOverlay,TourWelcomeSheet}.tsx`,
  `components/tour/{useTourTarget.ts,tourSteps.ts,index.ts}`; edits to `(tabs)/_layout.tsx`,
  `(tabs)/index.tsx`, `(tabs)/more.tsx`, `onboarding/complete.tsx`, `store/useAppStore.ts`,
  `types/index.ts`.
- **Deviations from plan:** built-in `Animated` instead of Reanimated; persist `version:1`
  migration added to opt-out existing installs; Supabase column sync deferred (§7); tab-pointer
  copy made descriptive.
- **Deferred follow-ups (unchanged):** cross-tab auto-navigating tour, Supabase
  `tutorial_completed_at` migration + sync, per-tab micro-coachmarks, tour analytics (§7).
- **Next action:** once on-device QA passes, move this file to
  `process/general-plans/completed/`.
