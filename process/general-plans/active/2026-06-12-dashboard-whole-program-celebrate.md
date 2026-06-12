# Dashboard Restructure — Whole-Program Snapshot + Celebrate-First UX

**Date:** 2026-06-12
**Author:** Plan (UX-focused) — SLICE mobile dashboard
**Scope:** Restructure `apps/mobile/app/(tabs)/index.tsx` so the **first screen shows the entire debt program** (not just the first settlement), make the experience celebratory and simple, and shift all savings language from **dictation → suggestion** across every surface where it appears.
**Status:** Active — plan complete, implementation not started.

---

## Why we're doing this (user intent)

Two directives from the product owner:

1. **Suggest, never dictate.** People won't put all of their surplus toward debt — they have other priorities. The app guides *possibilities*; it never tells users what to do or how much to save. Every savings number is a suggestion the user can take, change, or ignore.
2. **The dashboard is the whole program, and it should make people happy.** On the very first paint of the home screen — before any scrolling — the user should see their debt program *in its entirety*: their name, their debt program, the amount needed to settle, the length of the program, and the monthly savings. Today the first thing they see is a single-creditor "first settlement" card; that's wrong. The two goals of the app are **(1) celebrate with them** and **(2) be simple and user-friendly**. Users should find happiness in the dashboard.

### Decisions locked with the product owner

| Decision | Choice |
|---|---|
| Reach of "suggest not dictate" | **Everywhere savings appears** — dashboard, onboarding, program tab, savings-planner, what-if, readiness card |
| Hero celebratory centerpiece | **Overall progress (saved ÷ total target) + debt-free date** |
| Existing single-creditor `SettlementReadinessCard` | **Demote** it below the new whole-program snapshot as a "Your next focus" section (keep intact, just reordered) |

---

## Current state (what exists today)

**Home screen** `apps/mobile/app/(tabs)/index.tsx` (469 lines) renders, in order:
1. Header (logo, "Hi, {name}", "Your Plan", tier badge, profile icon)
2. `SavingsAccountPrompt` (post-onboarding, until done)
3. Tier upsell / member-benefits card
4. **`SettlementReadinessCard`** — the current hero, built around **one** creditor (the priority/first settlement). ← *the thing the user is reacting to*
5. `summaryRow` — three `SummaryCard`s: Total Debt, You Save, Debt-free
6. "Customized Program" section — `programOverview` Pressable that **already shows** whole-program info (program name, settlement estimate, monthly savings, debt-free-by) but is buried here
7. "Next Priority" — `CreditorCard`
8. "Quick Actions" 2×2 grid
9. Disclaimer

**Data already available in the screen** (no backend work needed):
- `getPersonalProgramName(profile.name)` → e.g. "Marc's Customized Debt Program"
- `totalDebt`, `totalTarget`, `savings`, `savingsRatio`, `months` (`getMaxProgramLength`)
- `aggregateProgram` = `debtProgram ?? buildSimpleDebtProgram(totalDebt, profile.defaultMonthlySavings)` → `{ totalDebt, estimatedSettlementAmount, monthlySavingsAmount, programLengthMonths, settlementRate }`
- `profile.currentSavedCash` (overall saved cash), `profile.defaultMonthlySavings`, `profile.defaultSettlementPercentage`
- `readiness` (`calcSettlementReadiness`) — still used for the demoted card
- `calcDebtFreeDate(months)`, `formatProgramLength(months)`, `formatCurrency(...)` in `utils/calculations.ts`

**Key insight:** The whole-program data is already computed on this screen. This is primarily a **reordering + new hero component + copy** task, not a data/backend task. Overall progress is derivable: `progress = clamp(currentSavedCash / totalTarget, 0, 1)`.

**Savings-dictation language to soften (the "everywhere" audit targets):**
- `onboarding/complete.tsx:226` — "Monthly commitment"; `:253` "FASTER OPTION" / "Use it"; `:116` writes `defaultMonthlySavings: monthlyContribution`
- `savings-planner.tsx:246` — "Monthly savings amount required"; `:203` "Need to change your monthly savings amount?"
- `components/SettlementReadinessCard.tsx:38` — "Save $X/day to reach your first offer fund."
- `(tabs)/program.tsx` — per-creditor ±50 "Monthly savings" stepper (framing only)
- `what-if.tsx` — verify language is suggestive (scan during execute)

---

## Design principles for this work

1. **Whole program first, one creditor later.** The home hero answers "How is my *entire* debt program going?" The single-creditor readiness moves to a "next focus" supporting role.
2. **Celebrate momentum and the finish line.** The hero pairs an overall progress indicator (how far along the whole program is) with the debt-free date — the emotional payoff.
3. **Suggestions, not orders.** Replace imperative/required language with invitational language. Numbers are framed as "a suggested pace," "you could," "many people choose," and are always editable. Never "you must," "required," "commitment."
4. **Simple first paint.** Above the fold = identity + program snapshot + one clear progress story. Everything secondary scrolls below, unchanged in behavior.
5. **Reuse, don't reinvent.** Use existing tokens, `formatCurrency`, `calcDebtFreeDate`, `formatProgramLength`, and the existing color system (`useColors()`).

---

## Target home screen order (after restructure)

1. Header — unchanged (consider warmer subtitle, see C2)
2. `SavingsAccountPrompt` — unchanged (still highest-priority post-onboarding nudge)
3. Tier upsell / member card — unchanged
4. **NEW: `ProgramSnapshotHero`** ← first program content the user sees
   - Program name (`getPersonalProgramName`)
   - **Overall progress** ring/bar: `currentSavedCash` ÷ `totalTarget`, with a celebratory caption
   - **Debt-free by** {month year} • {formatProgramLength(months)}
   - Snapshot stat grid: **Amount to settle** (`totalTarget`), **You save** (`savings`, `savingsRatio`% off), **Suggested monthly savings** (`aggregateProgram.monthlySavingsAmount`)
   - Settlement % badge (`defaultSettlementPercentage`)
   - Tappable → `/savings-planner` (preserves current `programOverview` affordance)
5. **"Your next focus"** section = the **demoted** `SettlementReadinessCard` (intact, with softened day copy) — the single-creditor "first offer" story now lives here
6. "Next Priority" `CreditorCard` — unchanged (or merged visually under "next focus"; see B3)
7. "Quick Actions" — unchanged
8. Disclaimer — unchanged

Empty state (no creditors) and loading skeleton: unchanged.

---

## Workstream A — New whole-program hero

### A1. Create `components/ProgramSnapshotHero.tsx` — P0, M
**What:** A new presentational component that is the first program element on home. Renders the whole-program snapshot the user explicitly listed: **name, the program, amount to settle, program length, monthly savings**, plus the locked celebratory centerpiece (**overall progress + debt-free date**).
**Props (keep it pure/presentational, mirror `SettlementReadinessCard` style):**
```ts
interface ProgramSnapshotHeroProps {
  programName: string;
  totalDebt: number;
  totalTarget: number;       // amount needed to settle
  savings: number;
  savingsRatio: number;      // % off
  currentSaved: number;      // profile.currentSavedCash
  months: number;            // program length
  suggestedMonthly: number;  // aggregateProgram.monthlySavingsAmount
  settlementPct: number;     // profile.defaultSettlementPercentage
  onPress: () => void;       // → /savings-planner
}
```
**Internal derived values:** `progress = totalTarget > 0 ? clamp(currentSaved / totalTarget, 0, 1) : 0`; `debtFree = months > 0 ? calcDebtFreeDate(months) : null`.
**Layout:**
- Eyebrow: program name (e.g. "Marc's Customized Debt Program")
- Centerpiece: progress track (reuse the readiness card's progress-track pattern; add `accessibilityRole="progressbar"` + `accessibilityValue`) + caption "Saved {currentSaved} of {totalTarget} • {Math.round(progress*100)}%". When `currentSaved === 0`, caption celebrates the *plan* instead ("Your plan is set — every dollar you set aside moves this bar.").
- Debt-free line: `months > 0 ? "Debt-free by {debtFree} • {formatProgramLength(months)}" : "Add a suggested monthly amount to see your timeline"`
- Stat grid (3 tiles): **To settle** = `formatCurrency(totalTarget)`; **You save** = `formatCurrency(savings)` / `subtitle {savingsRatio}% off`; **Suggested/mo** = `formatCurrency(suggestedMonthly)`
- Settlement % badge (top-right): `formatPct(settlementPct)`
**Why:** Delivers the literal request — entire program visible on first paint — and the locked celebratory framing.
**Files:** new `apps/mobile/components/ProgramSnapshotHero.tsx`.
**Verification:** Renders with sample data; progress bar fills correctly at 0%, 50%, 100%; debt-free fallback shows when `months === 0`.

### A2. Wire the hero into home + reorder — P0, M
**What:** In `(tabs)/index.tsx`, insert `<ProgramSnapshotHero .../>` immediately after the tier card and **before** `SettlementReadinessCard`. Move `SettlementReadinessCard` down into a new `Your next focus` section (A3). Remove the now-redundant `summaryRow` (its three stats are absorbed into the hero) and the standalone "Customized Program" `programOverview` block (its content is now the hero) — or keep `programOverview` only if it still adds value after the hero (default: **remove** to avoid duplication and keep it simple).
**Why:** First paint = whole program; eliminates duplicated stats (Total Debt / You Save / Debt-free appeared in both `summaryRow` and `programOverview`).
**Files:** `apps/mobile/app/(tabs)/index.tsx` (render block lines ~136–326; styles for `summaryRow`, `programOverview*`, `section` can be pruned).
**Verification:** First viewport on a seeded account shows name + progress + debt-free + settle/save/monthly with **no scroll**; no stat appears twice.

### A3. "Your next focus" demoted section — P1, S
**What:** Wrap the existing `SettlementReadinessCard` in a `section` with header "Your next focus" and place it below the hero (above or merged with "Next Priority"). Card itself is unchanged except copy (D3).
**Why:** Locked decision — keep the single-creditor first-offer story, just not as the lead.
**Files:** `apps/mobile/app/(tabs)/index.tsx`.
**Verification:** Readiness card still renders, celebrates `m16_ready` (the `useEffect` at lines 71–76 must remain), and links work.

---

## Workstream B — Simplicity & hierarchy

### B1. De-duplicate stats — P1, S
**What:** Ensure each number appears once. After A2, Total Debt / savings / debt-free live only in the hero. If product wants Total Debt still visible, show it as a small caption in the hero ("of {totalDebt} owed") rather than a separate tile.
**Files:** `(tabs)/index.tsx`.

### B2. Prune dead styles — P2, S
**What:** Remove now-unused `StyleSheet` entries (`summaryRow`, `programOverview*`, possibly `programPrompt*` if the tier card is untouched—verify before deleting) to keep the file lean.
**Files:** `(tabs)/index.tsx`.
**Verification:** `tsc`/lint clean; no unreferenced style warnings.

### B3. Consider folding "Next Priority" into "Your next focus" — P2, S
**What:** The demoted readiness card already names the priority creditor. The separate "Next Priority" `CreditorCard` may now be redundant. Option: keep both (readiness = money story, CreditorCard = creditor detail) or merge under one "Your next focus" header. **Default:** keep both but under sibling headers; revisit if it feels heavy.
**Files:** `(tabs)/index.tsx`.

---

## Workstream C — Celebrate & happiness

### C1. Celebratory progress copy in the hero — P1, S
**What:** The progress caption adapts to celebrate wherever the user is:
- 0% saved → "Your plan is set. 🎯 Every dollar you set aside moves this bar."
- 1–99% → "You're {n}% of the way to settling. Keep going!"
- 100% → "You've saved enough to settle your whole program. 🎉"
**Why:** Goal (1): celebrate with them. Tone matches existing warm voice in `celebrationCopy.ts`.
**Files:** `ProgramSnapshotHero.tsx`.

### C2. Warmer header subtitle (optional) — P2, S
**What:** "Your Plan" → keep, but consider a rotating encouraging subtitle under the greeting (e.g. "You're making progress, {firstName}"). Low priority; only if it doesn't add clutter.
**Files:** `(tabs)/index.tsx` lines 88–94.

### C3. Reuse the existing milestone/celebration system — P2, S
**What:** Do **not** build a new celebration mechanism. The existing `celebrate(key, opts)` + `celebrationCopy.ts` milestones (`m16_ready`, `m17_settled`, `m19_debt_free`, etc.) already fire confetti/haptics. Confirm the restructure doesn't break the `m16_ready` trigger (A3) and that whole-program milestones still surface. If a "program X% milestone" celebration is desired later, that's a separate plan (note as backlog).
**Files:** verify `(tabs)/index.tsx` `useEffect`; no new milestone keys in this plan.

---

## Workstream D — Suggest, never dictate (copy audit, "everywhere")

> Principle: numbers are **suggestions**, always editable, never commands. Replace "required / must / commitment / you need to" with "suggested / you could / many people choose / a pace that works for you."

### D1. Onboarding `complete.tsx` — P0, M
**What:**
- "Monthly commitment" (`:226`) → "Suggested monthly savings" (with helper "You can change this anytime").
- "FASTER OPTION / Use it" (`:253`–`:291`) → keep the faster-plan *offer* but frame as optional: "Want to go faster? You could set aside {availableCashFlow}/mo — but it's your call. Keep room for life." The body already says "keep room for irregular expenses" — strengthen that it's a suggestion, not a target.
- Make explicit near the contribution number: this is a starting suggestion, adjustable later.
**Why:** This is the strongest "use all your surplus" pressure point; the user called it out directly.
**Files:** `apps/mobile/app/onboarding/complete.tsx`.
**Guard:** Don't change the `handleStart` data write (`defaultMonthlySavings: monthlyContribution`) — copy only. Behavior unchanged.

### D2. `savings-planner.tsx` — P1, S
**What:** "Monthly savings amount required" (`:246`) → "Suggested monthly savings"; ensure surrounding copy frames the tracker as a suggested pace, not an obligation. "Need to change your monthly savings amount?" (`:203`) is already invitational — keep.
**Files:** `apps/mobile/app/savings-planner.tsx`.

### D3. `SettlementReadinessCard.tsx` — P1, S
**What:** `sublineFor` default (`:38`) "Save $X/day to reach your first offer fund." → "Setting aside about $X/day would get you there — at a pace that works for you." Keep numbers; soften the imperative.
**Files:** `apps/mobile/components/SettlementReadinessCard.tsx`.

### D4. `program.tsx` & `what-if.tsx` — P2, S
**What:** Scan during execute. Program tab's ±50 "Monthly savings" stepper label is neutral — fine; ensure no "required/must" copy. what-if is a simulator (inherently suggestive) — verify only.
**Files:** `apps/mobile/app/(tabs)/program.tsx`, `apps/mobile/app/what-if.tsx`.

### D5. Shared phrasing pass — P2, S
**What:** Where a single suggested-savings string is reused, prefer centralizing tone. If `getNextBestMove`/`headlineFor` copy implies obligation, soften consistently so dashboard + onboarding read in one voice.
**Files:** `utils/calculations.ts` (copy in `getNextBestMove`), `SettlementReadinessCard.tsx`.

---

## Out of scope (note as backlog if desired)

- Backend/data model changes — none needed; all values already on the screen.
- Per-creditor "amount saved so far" tracking for a more precise overall-progress denominator (current uses `currentSavedCash / totalTarget`, which is a fair whole-program proxy).
- A brand-new "program reached X%" milestone celebration (separate plan).
- Dark mode / spacing-token refactor (tracked in `2026-06-11-ux-audit-improvements.md`).

---

## Touchpoints summary

| File | Change | Priority |
|---|---|---|
| `apps/mobile/components/ProgramSnapshotHero.tsx` | **NEW** whole-program hero | P0 |
| `apps/mobile/app/(tabs)/index.tsx` | Wire hero, reorder, demote readiness, prune stats/styles | P0 |
| `apps/mobile/app/onboarding/complete.tsx` | Suggestion-not-dictation copy | P0 |
| `apps/mobile/app/savings-planner.tsx` | "required" → "suggested" copy | P1 |
| `apps/mobile/components/SettlementReadinessCard.tsx` | Soften imperative subline; demoted-context safe | P1 |
| `apps/mobile/app/(tabs)/program.tsx` | Verify/soften savings copy | P2 |
| `apps/mobile/app/what-if.tsx` | Verify suggestive copy | P2 |
| `apps/mobile/utils/calculations.ts` | Soften shared move/headline copy if needed | P2 |

**Blast radius:** One new presentational component + one screen reorder + copy edits across ~6 files. No data-model, API, auth, or schema changes. No new dependencies.

---

## Verification & acceptance

**Manual (primary — UX work):**
1. Seed/sign in to an account with ≥1 creditor and `currentSavedCash = 0`. Open home → first viewport (no scroll) shows: program name, progress bar at 0% with celebratory caption, debt-free date + length, and to-settle / you-save / suggested-monthly stats.
2. Set `currentSavedCash` to ~50% of `totalTarget` (via profile/add-to-fund) → progress bar fills ~50%, caption reads "You're 50% of the way…".
3. Scroll down → "Your next focus" (readiness card) and "Next Priority" still render and link correctly; `m16_ready` celebration still fires when ready.
4. Empty state (no creditors) and loading skeleton unchanged.
5. Onboarding complete screen: no "commitment/required" wording; the faster-plan option reads as optional; "Start My Program" still works and persists the same data.
6. savings-planner: "Suggested monthly savings" wording; tracker still generates.
7. Accessibility: hero progress bar exposes `accessibilityRole="progressbar"` + value; tappable hero has a label.

**Automated:**
- `tsc` / typecheck clean; lint clean (no unused styles/imports after pruning).
- Existing tests in `lib/*.test.ts` (e.g. `settlementReadiness.test.ts`, `debtProgram.test.ts`) still pass — this work is copy + presentation, no calculation changes, so no test changes expected. If `utils/calculations.ts` copy in `getNextBestMove` changes, update any snapshot/string assertions.
- Run `vc-tester` (diff-aware) after implementation.

**Definition of done:**
- First paint of home = entire debt program (name, to-settle, length, monthly) + overall progress + debt-free date, no scroll.
- Single-creditor readiness demoted, intact, celebration preserved.
- No savings copy anywhere reads as a command; all framed as suggestions.
- No duplicated stats; file lean; types/lint/tests green.

---

## Suggested execution order

1. A1 `ProgramSnapshotHero` (build in isolation) → 2. A2 wire + reorder → 3. A3 demote readiness → 4. B1/B2 de-dupe + prune → 5. C1 celebratory copy → 6. D1 onboarding copy (P0) → 7. D2/D3 savings-planner + readiness copy → 8. D4/D5 verify program/what-if/shared copy → 9. typecheck/lint/`vc-tester` → 10. manual UX pass on device/simulator.

---

## Resume handoff

- **State:** Plan written, not started.
- **Next action:** Enter EXECUTE on this file, starting with A1 (`ProgramSnapshotHero.tsx`).
- **Critical preserve points:** the `m16_ready` `useEffect` in `(tabs)/index.tsx` (lines 71–76); `handleStart` data writes in `complete.tsx`; empty/loading branches in home.
- **Key data already on home screen:** `programName`, `totalDebt`, `totalTarget`, `savings`, `savingsRatio`, `months`, `aggregateProgram`, `profile.currentSavedCash`, `profile.defaultSettlementPercentage` — no fetching to add.
