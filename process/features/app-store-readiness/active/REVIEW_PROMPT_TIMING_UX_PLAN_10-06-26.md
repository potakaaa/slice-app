# PLAN: In-App Review Prompt — Timing & Frequency UX

**Date:** 2026-06-10
**Type:** SIMPLE→MEDIUM (single module + thresholds + 2–3 new trigger surfaces)
**Status:** EXECUTED (2026-06-10) — code-complete; typecheck clean, 30/30 unit tests pass.
On-device QA pending (native module requires a dev/prebuild rebuild). **Note:** per user
request, an early **2nd/3rd-app-open** launch prompt was added (`maybeRequestReviewOnLaunch`),
gated by the safety gates only (skips install-age + happy-score by design).
**App:** `apps/mobile` (SLICE — debt-settlement / snowball / credit-repair)
**Owner:** UI/UX
**Builds on:** `process/general-plans/active/2026-06-09-review-worthy-ux.md` (Pillar 3, EXECUTED)

> The native review sheet already exists (`lib/reviewPrompt.ts`, `expo-store-review@~9`).
> This plan does **not** rebuild it. It tunes **when** and **how often** it fires so the ask
> feels *earned*, never transactional or annoying.

---

## 1. Objective

Maximize the odds a *genuinely happy* user is asked to review — and guarantee an *unhappy,
new, or busy* user is never interrupted. The native sheet (`SKStoreReviewController` /
Android In-App Review) is a finite, throttled resource (iOS: ~3 prompts / 365 days, and it
may silently no-op). We treat every prompt as a scarce, one-shot privilege and spend it only
at a true peak-positive moment.

### Design principles (the "not annoying" contract)
1. **Earned, not eager.** Ask only after the user has felt real, repeated success — not the
   first action, not on install day.
2. **Peak-End rule.** Fire at the emotional summit of a win (debt settled, payoff complete),
   *after* the celebration resolves, on a calm screen.
3. **Never on negative space.** No prompts on errors, empty states, loading, paywalls,
   onboarding, or first launch.
4. **Best-effort, never blocking.** The sheet may not appear; UX must never depend on it and
   must never show our own "rate us" modal as a fallback.
5. **Generous cooldowns.** One shipped version is not the only guard — add install-age,
   session-count, and a global min-interval so frequent releases can't nag.
6. **Silent sentiment routing.** No "Do you love Slice?" pre-modal. Behavioral wins are the
   satisfaction signal; negative signals *suppress* future asks.

---

## 2. Current State (what exists today)

`apps/mobile/lib/reviewPrompt.ts` — `maybeRequestReview()` gates on:
- `state.happyMomentCount >= MIN_HAPPY_MOMENTS` where **`MIN_HAPPY_MOMENTS = 1`**
- once per app **version** (`reviewPromptedVersion`)
- platform availability (`isAvailableAsync` + `hasAction`)
- marks-before-requesting to prevent double-fire; errors swallowed to crash reporter

Store (`store/useAppStore.ts`): `happyMomentCount`, `reviewPromptedVersion`,
`recordHappyMoment()`, `markReviewPrompted()` — all persisted.

Trigger surfaces (only 2):
- `app/creditor/[id].tsx` — creditor marked **settled** → celebration → `onDone` → fire
- `app/creditor/log-call/[id].tsx` — "Offer Accepted" settle → celebration → `onDone` → fire

### Gaps this plan closes
| # | Gap | Why it risks "annoying" |
|---|-----|------------------------|
| G1 | `MIN_HAPPY_MOMENTS = 1` | First settle → immediate ask feels like a transaction, not a relationship |
| G2 | No install-age / session-count gate | Install → add fake creditor → settle → prompt in <2 min |
| G3 | No global min-interval across versions | Weekly releases could re-ask every version |
| G4 | No negative-signal suppression | A user who just hit a crash/support flow can still be asked |
| G5 | Only 2 trigger surfaces; all wins weighted equally | Misses the *biggest* peaks (full payoff, debt-free) and over-indexes on small settles |
| G6 | Sheet fires the instant overlay `onDone` runs | Can collide with confetti exit animation |

---

## 3. The Decision Model (the heart of the plan)

A prompt fires **only when ALL hard gates pass AND the moment clears the value bar.**

### 3a. Hard gates (all must be true) — centralized in `maybeRequestReview()`
1. **Install age** ≥ **3 days** since first launch.
2. **Sessions** ≥ **3** app opens (distinct days preferred).
3. **Goodwill** — weighted happy-moment score ≥ **3** (see 3b; replaces the raw count of 1).
4. **Per-version** — not already prompted on this `version`.
5. **Global cooldown** — ≥ **60 days** since the last prompt of *any* version.
6. **No recent negative signal** — no crash, failed payment, or support/contact action in
   the last **7 days**.
7. **Platform allows** — `isAvailableAsync()` && `hasAction()` (unchanged).

### 3b. Weighted happy-moments (replace flat +1)
Not all wins are equal; weight by emotional magnitude so the *score* reaches the bar through
genuinely meaningful events, and the biggest peaks become the actual firing moment.

| Moment | Weight | Rationale |
|--------|:-----:|-----------|
| Creditor marked **settled** | **+1** | Real but routine win |
| Creditor **fully paid off** (balance → 0) | **+2** | Larger relief |
| **Snowball milestone** (e.g., a whole debt cleared / next target unlocked) | **+1** | Momentum |
| **Savings / fund milestone** reached | **+1** | Tangible progress |
| **Debt-free** (last creditor cleared) | **fire-eligible immediately** | The ultimate peak — always a candidate (still respects gates 1,2,4,5,6,7) |

`recordHappyMoment(weight = 1)` gains an optional weight; `happyMomentCount` becomes a
weighted score (rename to `happyMomentScore` internally, keep persisted key migration-safe).

### 3c. Trigger surfaces — *where* we call `maybeRequestReview()`
Fire **after** the celebration overlay fully dismisses (Peak-End), with a **~600 ms settle
delay** so the native sheet lands on a calm screen, not over confetti.

- ✅ Keep: creditor settled (`creditor/[id].tsx`), offer accepted (`log-call/[id].tsx`)
- ➕ Add: **full payoff** moment (balance reaches 0)
- ➕ Add: **debt-free** moment (last creditor cleared) — the single best moment to ask
- ➕ Optional: **savings/fund milestone** celebration (`add-to-fund.tsx` / savings-planner)

> Ordering: because the strongest peaks carry the most weight, by the time the score hits the
> bar the user has usually *just* done something meaningful — so the surface that crosses the
> threshold is naturally a high point.

### 3d. Negative-signal suppression (new)
Record a timestamp on: unhandled error reported, payment/purchase failure, and any
support/contact/legal-dispute action. Gate 6 reads the most recent of these. This is the
"silent sentiment" fork — unhappy users are *quietly excluded*, never shown a feedback modal.

---

## 4. Touchpoints (files to change)

| File | Change |
|------|--------|
| `apps/mobile/lib/reviewPrompt.ts` | Add gates 1,2,3(weighted),5,6; add ~600 ms post-dismiss delay; keep mark-before-request |
| `apps/mobile/store/useAppStore.ts` | Add `firstLaunchAt`, `sessionCount`, `lastPromptAt`, `lastNegativeSignalAt`; weighted `recordHappyMoment(weight?)`; bump `recordSession()`, `recordNegativeSignal()`; persist + migration for existing `happyMomentCount` |
| `apps/mobile/app/_layout.tsx` (or root) | On cold start: set `firstLaunchAt` once, increment `sessionCount` |
| `apps/mobile/app/creditor/[id].tsx` | Weighted happy moment (settled +1, payoff +2, debt-free → eligible); delayed fire |
| `apps/mobile/app/creditor/log-call/[id].tsx` | Same weighting/delay pattern |
| `apps/mobile/app/add-to-fund.tsx` / savings-planner | (Optional) record savings milestone happy moment |
| `apps/mobile/lib/crashReporting.ts` | On `reportError`, also stamp `lastNegativeSignalAt` |
| payment failure handler (pricing/membership) | Stamp `lastNegativeSignalAt` on failed purchase |

### Tunable constants (single source of truth at top of `reviewPrompt.ts`)
```
MIN_INSTALL_AGE_DAYS = 3
MIN_SESSIONS         = 3
MIN_HAPPY_SCORE      = 3
GLOBAL_COOLDOWN_DAYS = 60
NEGATIVE_SUPPRESS_DAYS = 7
SETTLE_DELAY_MS      = 600
```

---

## 5. Decision Flow

```
celebration onDone
  └─ wait SETTLE_DELAY_MS (let confetti exit)
       └─ maybeRequestReview()
            ├─ installAge < 3d ......... return false
            ├─ sessions  < 3 .......... return false
            ├─ happyScore < 3 (unless debt-free) return false
            ├─ promptedThisVersion ..... return false
            ├─ sinceLastPrompt < 60d ... return false
            ├─ negativeSignal < 7d ..... return false
            ├─ !platformAvailable ...... return false
            └─ mark(version, now) → StoreReview.requestReview()
```

---

## 6. Verification

- **Unit (extend existing 13 tests):** table-driven cases for each gate boundary
  (age 2d vs 3d, sessions 2 vs 3, score 2 vs 3, version repeat, cooldown 59d vs 60d,
  negative signal 6d vs 7d, debt-free fast-path, platform unavailable → no mark so retry-able).
- **Manual on device (requires dev/prebuild — native module):**
  1. Fresh install → settle one creditor → **no prompt** (age + score gates).
  2. Simulate 3+ days / 3+ sessions + reach score 3 → settle → **prompt appears once**.
  3. Same version, settle again → **no second prompt**.
  4. Trigger an error, then a win within 7 days → **suppressed**.
  5. Debt-free path → eligible immediately (other gates respecting).
- **Analytics (optional, recommended):** log gate-failure reason (no PII) to learn which gate
  most often blocks, to retune constants post-launch.

---

## 7. Risks & Mitigations
- **Sheet silently no-ops (iOS throttle):** expected; we never mark unless `requestReview` is
  actually called, and never show a fallback modal. Acceptable by design.
- **Over-gating → almost never asks:** constants are centralized + analytics-instrumented so
  thresholds can be relaxed quickly without a logic rewrite.
- **Persisted-state migration:** keep `happyMomentCount` readable; map to `happyMomentScore`
  on first load to avoid resetting existing users' goodwill.

---

## 8. Out of Scope
- Custom in-app "rate us" UI / sentiment modal (deliberately rejected — adds friction to a
  happy moment and conflicts with Apple HIG).
- Push-notification re-engagement asks.
- Server-side remote config for thresholds (constants are local for now).

---

## 9. Resume Handoff
- **Next action if approved:** ENTER EXECUTE MODE → `vc-execute-agent` with this plan path.
- **Single source of tuning:** constants block in `lib/reviewPrompt.ts`.
- **Done = ** all gates implemented + weighted moments wired into 4 surfaces + unit tests green
  + on-device smoke test (steps in §6) passes after a prebuild rebuild.
