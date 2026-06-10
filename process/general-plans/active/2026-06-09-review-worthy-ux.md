# PLAN: Review-Worthy UX — The Three Pillars

**Date:** 2026-06-09
**Type:** COMPLEX (3 workstreams / phases)
**Status:** EXECUTED (2026-06-09) — code-complete; native rebuild + on-device QA pending
**App:** `apps/mobile` (SLICE — debt-settlement / snowball / credit-repair)

> **Execution decisions:** crash reporting = pluggable `lib/crashReporting.ts` (no external
> account; Sentry slots in via two functions); confetti = Reanimated (no new dep); review =
> `expo-store-review@~9.0.0`; pre-auth value = live savings banner in onboarding step 2.
> Typecheck clean, 13/13 unit tests pass. **Not yet verified on device** (new native module
> `expo-store-review` requires a dev/prebuild rebuild).

> Distinct from `2026-06-09-three-pillars-section.md`, which builds a *marketing web-sandbox
> component*. **This** plan implements the three pillars as real UX changes inside the mobile app.

---

## 1. Objective

Raise SLICE's odds of earning 4–5★ reviews by implementing the three pillars of a
review-worthy app **inside the product**, then asking the right users to review at the right
moment:

1. **Instant Value Delivery** — surface the core "you could save $X" win inside the first
   60 seconds, before sign-up gates it.
2. **Smooth User Experience** — eliminate crash/dead-end risk: crash reporting, resilient
   error recovery, loading skeletons, smooth transitions.
3. **Emotional Connection** — build celebration moments (settled creditor, savings
   milestones) and trigger the in-app review prompt at peak positive emotion.

### Guiding principles (verbatim from reference)

1. **Instant Value Delivery** — Deliver core value within the first 60 seconds. Users who get
   a quick win are 4x more likely to leave a positive review. Don't gate best features behind
   lengthy onboarding.
2. **Smooth User Experience** — Crashes, bugs, and confusing navigation are review killers. A
   single crash can turn a 5-star reviewer into a 1-star complaint.
3. **Emotional Connection** — The most enthusiastic reviews come from apps that make users feel
   something — accomplishment, relief, joy, surprise. Build moments of delight.

---

## 2. Current State (discovered)

| Area | Finding | File(s) |
|---|---|---|
| Onboarding flow | `index → step1 → step2 → step3 → /auth → complete`. Savings payoff only on `complete`. | `app/onboarding/*.tsx`, `app/index.tsx` |
| First payoff | `"Your Program Is Ready!"` with total debt / settlement / **potential savings** + success haptic — but it renders **after sign-up**. | `app/onboarding/complete.tsx:54,112,132` |
| Animations | `react-native-reanimated@~4.1.1` **installed, zero usage** across `app/` & `components/`. | `apps/mobile/package.json` |
| Haptics | `expo-haptics@~15.0.8` installed; used in only 3 places. | `complete.tsx`, `coaching.tsx`, `components/Button.tsx` |
| Crash reporting | `ErrorBoundary` exposes `onError`, but root usage passes **no handler** → crashes are swallowed silently. No Sentry. | `components/ErrorBoundary.tsx`, `app/_layout.tsx` |
| Error recovery | `ErrorFallback` exists; quality/UX TBD (resetError wired). | `components/ErrorFallback.tsx` |
| Loading states | Root index shows a bare `ActivityIndicator`; data screens lack skeletons. | `app/index.tsx:44`, `(tabs)/index.tsx` |
| In-app review | **None.** `expo-store-review` not installed; no prompt logic anywhere. | — |
| Milestones | Settling a creditor / hitting savings targets has no celebratory feedback. | `(tabs)/index.tsx`, `creditor/[id].tsx` |
| State store | Zustand store (`store/useAppStore`) already persists draft/onboarding flags — natural home for review-trigger + milestone flags. | `store/useAppStore` |

**Net gap vs. each pillar:** value is sign-up-gated (Pillar 1 weak), crashes are invisible and
transitions are static (Pillar 2 weak), and there are zero delight/celebration moments and no
review ask (Pillar 3 essentially absent).

---

## 3. Scope

### In scope
- Pre-auth instant savings estimate in onboarding.
- Crash reporting wiring + improved error recovery + loading skeletons + screen transitions.
- Celebration moments (settled creditor, savings milestones) with animation + haptics.
- Smart, gated in-app review prompt via `expo-store-review`.
- A small reusable delight/feedback toolkit (haptics helper, celebration overlay).

### Out of scope (call out, don't build here)
- Backend/schema changes, pricing/paywall changes, new financial features.
- The web-sandbox marketing section (separate plan).
- A/B testing infrastructure (note as future).

### New dependencies
| Package | Why | Pillar |
|---|---|---|
| `expo-store-review` | Native StoreReview prompt (App Store / Play) | 3 |
| Crash reporting — **`@sentry/react-native`** (recommended) *or* `expo-insights`/manual logger | Catch crashes before they become 1★ reviews | 2 |
| *(optional)* `react-native-confetti-cannon` or a Reanimated-built confetti | Celebration visuals (Reanimated path avoids a dep) | 3 |

> **Decision needed (see §8):** crash-reporting vendor, and confetti via new dep vs. Reanimated.

---

## 4. Workstreams (run as phases)

### PHASE 1 — Pillar 1: Instant Value Delivery

**Goal:** user sees a concrete "you could save $X" number within ~60s, **before** the auth gate.

1. **Live estimate during onboarding.** In the creditor/debt entry step, compute and display a
   running settlement-savings estimate as the user types (reuse `getTotalDebt`,
   `getTotalSettlementTarget`, `getMaxProgramLength` from `@/utils/calculations`). The user
   gets the "aha" mid-flow, not only on `complete`.
   - Touchpoints: `app/onboarding/step1.tsx` (+ `step2`/`step3` as the entry steps dictate).
2. **Pre-auth "quick win" preview.** Before routing to `/auth`, show the savings number the user
   just generated (a lightweight version of `complete.tsx`'s stat block) so value lands before
   account creation. Auth becomes "save your plan," not "unlock the value."
   - Touchpoints: onboarding draft → auth handoff in `app/index.tsx`, `store/useAppStore`
     (`onboardingReadyForAuth`), possibly a new `app/onboarding/preview.tsx`.
3. **Welcome-screen teaser (optional).** Replace the static feature list on
   `app/onboarding/index.tsx` with a one-tap interactive "Estimate my savings" entry.

**Verification:** Fresh install → reach a real savings figure in <60s and before sign-up.
Existing `debtProgram`/calculation unit tests still green (`lib/debtProgram.test.ts`).

---

### PHASE 2 — Pillar 2: Smooth User Experience

**Goal:** no silent crashes, no dead ends, no janky/abrupt screens.

1. **Crash reporting.** Wire `ErrorBoundary`'s `onError` in `app/_layout.tsx` to the chosen
   reporter; init the SDK at app start (guarded for dev/Expo Go). Capture
   `error + componentStack`.
   - Touchpoints: `app/_layout.tsx`, `components/ErrorBoundary.tsx`, new `lib/crashReporting.ts`.
2. **Resilient ErrorFallback.** Ensure a friendly, on-brand recovery screen: clear copy, "Try
   again" (existing `resetError`), and "Go home" escape. Audit/improve
   `components/ErrorFallback.tsx`.
3. **Loading skeletons.** Replace bare `ActivityIndicator` (`app/index.tsx:44`) and data-screen
   spinners with branded skeletons so launch/data loads feel intentional, not stalled.
   - Touchpoints: `app/index.tsx`, `(tabs)/index.tsx`, new `components/Skeleton.tsx`.
4. **Smooth transitions (use the idle Reanimated dep).** Add subtle entrance/press animations to
   key surfaces (dashboard cards, list items) and verify stack/tab transitions feel polished.
   - Touchpoints: `components/Card.tsx`, `CreditorCard.tsx`, `SummaryCard.tsx`.
5. **Flow QA pass.** Hand the changed flows to `vc-tester` ("test every flow multiple times")
   per pillar 2. Cover empty states, error states, slow network, back-navigation, and the
   onboarding→auth→dashboard happy path.

**Verification:** Forced render error reports to the dashboard + shows ErrorFallback (not a white
screen). No bare spinners on cold start. `vc-tester` reports the changed flows green.

---

### PHASE 3 — Pillar 3: Emotional Connection + Review Ask

**Goal:** create genuine delight at accomplishment, then ask happy users to review.

1. **Delight toolkit.** Small reusable pieces: a haptics helper (`lib/haptics.ts` wrapping
   `expo-haptics` patterns) and a `CelebrationOverlay` (Reanimated confetti/scale-in + success
   haptic).
2. **Celebration moments.** Fire celebration + haptic on real accomplishments:
   - First creditor added / program created (extend existing `complete.tsx` success).
   - A creditor marked **settled** (`creditor/[id].tsx` status change).
   - Savings milestones crossed (e.g., first $1k projected/realized) on the dashboard.
   - Touchpoints: `creditor/[id].tsx`, `(tabs)/index.tsx`, `store/useAppStore` (milestone flags
     so each celebration fires once).
3. **Broaden haptics.** Add light/selection feedback to primary CTAs and key navigation taps
   (sparingly, not everywhere).
4. **Gated in-app review prompt.** Add `lib/reviewPrompt.ts` using `expo-store-review`:
   - **Trigger** only at peak positive emotion (e.g., right after a settled-creditor celebration
     or a milestone), **never** on errors/empty states.
   - **Gate:** `isAvailableAsync()`, at least one prior happy moment, not previously prompted
     this version, respect OS throttling. Persist a `reviewPromptedAt` flag in the store.
   - Touchpoints: new `lib/reviewPrompt.ts`, `store/useAppStore`, call site at celebration.

**Verification:** Settling a creditor plays the celebration + haptic; on a clean qualifying state
the native review sheet is requested (dev log when `isAvailableAsync` is false in Expo Go);
prompt never appears on first launch, on errors, or twice.

---

## 5. Sequencing & Dependencies

```
Phase 1 (Instant Value) ─┐
Phase 2 (Smooth UX) ──────┼─► Phase 3 needs the milestone/celebration hooks from §4.2,
Phase 3 (Emotion+Review) ─┘   and the review ask should ship AFTER Phase 2 stability work
                              (don't invite reviews of a crashy build).
```
- Phases 1 and 2 are independent and can run in parallel.
- **Phase 3's review prompt must land after Phase 2** — asking for reviews before crash
  reporting/error recovery is in place risks soliciting 1★ reviews.
- Recommend executing one phase at a time with a `vc-tester` gate between phases.

---

## 6. Touchpoint Summary

**New files**
- `apps/mobile/lib/crashReporting.ts`
- `apps/mobile/lib/haptics.ts`
- `apps/mobile/lib/reviewPrompt.ts`
- `apps/mobile/components/Skeleton.tsx`
- `apps/mobile/components/CelebrationOverlay.tsx`
- *(maybe)* `apps/mobile/app/onboarding/preview.tsx`

**Edited files**
- `apps/mobile/app/_layout.tsx` (crash init + onError)
- `apps/mobile/app/index.tsx` (skeleton)
- `apps/mobile/app/onboarding/index.tsx`, `step1.tsx` (+ step2/step3 as needed) (live estimate / teaser)
- `apps/mobile/app/(tabs)/index.tsx` (milestone celebration + skeleton)
- `apps/mobile/app/creditor/[id].tsx` (settled celebration + review trigger)
- `apps/mobile/components/ErrorFallback.tsx` (recovery UX)
- `apps/mobile/components/Card.tsx`, `CreditorCard.tsx`, `SummaryCard.tsx` (transitions)
- `apps/mobile/store/useAppStore` (milestone + review flags)
- `apps/mobile/package.json` (new deps)

---

## 7. Blast Radius / Risk

- **Medium.** Touches onboarding routing (Phase 1) and the root error boundary (Phase 2) — both
  user-critical paths. Mitigate: keep changes additive, guard reporter init for dev/Expo Go, and
  run the onboarding→auth→dashboard path through `vc-tester` after Phase 1 and Phase 2.
- **Review-prompt misuse risk:** prompting at the wrong moment hurts ratings. Gating logic in
  §4.3 (Phase 3) is the safeguard — review it carefully before merge.
- **No backend/schema/auth-logic changes.** Store additions are local persisted flags only.
- New deps add native modules → requires a dev/prebuild rebuild (note for Phase 2/3 EXECUTE).

---

## 8. Open Decisions (resolve before/at EXECUTE)

1. **Crash reporting vendor:** `@sentry/react-native` (rich, dashboards) vs. a lighter
   Expo-native/manual logger. Recommendation: Sentry.
2. **Confetti:** new dep (`react-native-confetti-cannon`) vs. hand-rolled Reanimated (no new dep).
   Recommendation: Reanimated, since it's already installed and unused.
3. **Pre-auth value depth:** full interactive estimate vs. a simple single-number teaser before
   sign-up (privacy/scope trade-off).
4. **Run as one plan or a phase program?** Given 3 workstreams + new native deps, this is a
   candidate for the phase-program loop (research → execute → tester → report per phase).

---

## 9. Verification (overall)

- [ ] Cold install reaches a real savings number in <60s, before the auth gate (Pillar 1).
- [ ] Forced error → crash report captured + ErrorFallback recovery shown, no white screen (Pillar 2).
- [ ] No bare spinners on cold start; transitions feel smooth; `vc-tester` flows green (Pillar 2).
- [ ] Settling a creditor / hitting a milestone plays celebration + haptic (Pillar 3).
- [ ] Review sheet requested only on a qualifying happy state, once, never on errors (Pillar 3).
- [ ] `pnpm -C apps/mobile lint` + `tsc --noEmit` clean; existing tests green.

---

## Resume Handoff

- **Next action:** pick execution mode — confirm Open Decisions §8 (esp. #1 vendor, #4
  one-plan-vs-program), then `ENTER EXECUTE MODE` starting with **Phase 1** (lowest risk, highest
  visible payoff) unless you prefer Phase 2 stability first.
- **Nothing started** — no partial state. Phases 1 & 2 parallelizable; Phase 3 review ask must
  follow Phase 2.
