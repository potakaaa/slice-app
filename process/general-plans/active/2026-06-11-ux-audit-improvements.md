# UX Audit & Improvement Plan — SLICE Mobile

**Date:** 2026-06-11
**Author:** UI/UX design review (senior design pass)
**Scope:** Feature-by-feature UX audit of `apps/mobile` with prioritized, developer-ready fixes.
**Status:** Active — audit complete, implementation not started.

---

## How to read this plan

Each finding has: **what's wrong**, **why it matters**, **the fix**, and **file(s)**. Findings are grouped by workstream and tagged with priority + effort:

- **P0** = correctness/accessibility/trust issue, ship first
- **P1** = clear UX win, low risk
- **P2** = polish / larger refactor
- Effort: **S** (<30 min), **M** (1–3 hrs), **L** (multi-screen / day+)

A suggested phased rollout is at the bottom.

---

## Design principles guiding this audit

1. **One screen, one job.** Each screen should answer a single question clearly before offering secondary actions.
2. **Hierarchy through type + space, not color alone.** The app currently leans heavily on the orange primary as a background for emphasis; we want type scale and spacing to carry more of the load.
3. **Every number should be trustworthy.** A finance app loses users the moment a displayed figure looks wrong or contradicts another screen.
4. **Accessible by default.** Minimum 4.5:1 text contrast, 44×44 touch targets, labeled controls.
5. **Consistency is a feature.** The same control (percentage picker, stepper, stat tile) should look and behave identically everywhere.

---

## Workstream A — Design system foundations

These are upstream fixes; resolving them removes whole classes of downstream inconsistency.

### A1. Introduce spacing + typography scale tokens — P1, L
**What:** Magic numbers are everywhere (`padding: 16/20/14`, font sizes `11/12/13/14/15/18/22/26`, radii `8/10/12/14/16`). There is no shared scale, so screens drift.
**Why:** Inconsistent rhythm is the single biggest source of "slightly off" feel. A scale also makes future changes global.
**Fix:** Add `spacing` (4-pt scale: 4/8/12/16/20/24/32) and `type` (size+lineHeight+family presets: `display`, `title`, `heading`, `body`, `label`, `caption`) to `constants/colors.ts` or a new `constants/theme.ts`, surfaced through `useColors()`/a `useTheme()` hook. Migrate screens incrementally.
**Files:** `constants/colors.ts`, `hooks/useColors.ts`, new `constants/theme.ts`.

### A2. Fix muted text contrast — P0, S
**What:** `mutedForeground: #888888` on white is ~3.5:1 — **fails WCAG AA** (4.5:1) for the small text it's used on (hints, labels, captions, subtitles everywhere).
**Why:** Legibility + accessibility compliance (App Store / ADA exposure for a finance product).
**Fix:** Darken to ~`#6B6B6B` (≈5.0:1) or `#666666`. One-line change, app-wide benefit.
**Files:** `constants/colors.ts:14`.

### A3. Ship a real dark mode (or explicitly opt out) — P2, L
**What:** `useColors()` is already written to switch on `useColorScheme()`, but `colors.ts` ships **light only**, so dark-mode devices render full-white. Several screens also hardcode `#FFFFFF`/`#E8E8E8` instead of tokens (e.g. `profile.tsx:385`, many card-on-primary blocks), which would break under theming.
**Why:** Jarring on dark devices; hardcodes are latent bugs.
**Fix:** Either (a) add a `dark` palette to `colors.ts` and replace hardcoded hex with tokens, or (b) lock the app to light via `userInterfaceStyle` in `app.json` and document the decision. Recommend (b) short-term, (a) as a tracked follow-up.
**Files:** `constants/colors.ts`, `app.json`, audit hardcoded hex across `app/` + `components/`.

### A4. Standardize reusable controls — P1, M
**What:** The same UI is re-implemented per screen: percentage pickers (`onboarding/step1`, `profile`), ±50 steppers (`program`), stat tiles (`home`, `profile`, `program`, readiness card). Slight differences in each.
**Why:** Visual inconsistency + duplicated maintenance.
**Fix:** Extract `<SegmentedPercent>`, `<Stepper>`, and `<StatTile>` components. Replace ad-hoc copies.
**Files:** new `components/SegmentedPercent.tsx`, `components/Stepper.tsx`, `components/StatTile.tsx`; refactor `onboarding/step1.tsx`, `profile.tsx`, `program.tsx`, `(tabs)/index.tsx`.

### A5. Add accessibility labels to icon-only controls — P0, M
**What:** Icon-only `Pressable`s lack `accessibilityRole`/`accessibilityLabel`: add-creditor "+" (`creditors.tsx:47`), profile icon (`index.tsx:99`), search clear "x", program ± steppers, "Add to fund". Progress bars expose no value.
**Why:** Screen-reader users can't operate these; also an App Store accessibility expectation.
**Fix:** Add `accessibilityRole="button"` + descriptive `accessibilityLabel`; give progress views `accessibilityRole="progressbar"` + `accessibilityValue`.
**Files:** `(tabs)/creditors.tsx`, `(tabs)/index.tsx`, `(tabs)/program.tsx`, `components/SettlementReadinessCard.tsx`, `components/ProgressBar.tsx`.

---

## Workstream B — Data correctness & trust

### B1. Hardcoded "50%" settlement badge on Home — P0, S
**What:** The "Customized Program" overview card renders a literal `50%` badge (`(tabs)/index.tsx:252-253`) regardless of the user's actual `profile.defaultSettlementPercentage`.
**Why:** Directly contradicts the user's chosen target elsewhere — erodes trust in every other number.
**Fix:** Render `${Math.round(profile.defaultSettlementPercentage * 100)}%`.
**Files:** `(tabs)/index.tsx`.

### B2. CreditorCard progress bar is always 0% — P1, S
**What:** `CreditorCard` renders `<ProgressBar progress={0} />` hardcoded (`CreditorCard.tsx:91`) under a "% target" label.
**Why:** A progress bar that never fills reads as broken/empty and adds visual noise.
**Fix:** Either wire it to real saved-vs-target progress (per-creditor allocation of `currentSavedCash`), or remove the bar and keep the target % text until real per-creditor progress exists. Recommend removing now, wiring later.
**Files:** `components/CreditorCard.tsx`.

### B3. Unify "timeline/tracker" entry points — P1, M
**What:** Three differently-labeled paths point at overlapping timeline concepts: Home "View Tracker" → `savings-planner`, "Full Timeline" → `snowball`, Program tab "View Snowball Timeline" → `snowball`, plus Tools lists both. Users can't tell what's different.
**Why:** Redundant IA creates decision friction and makes the app feel larger/more confusing than it is.
**Fix:** Define one canonical name per destination ("Savings Tracker" vs "Snowball Timeline"), use it consistently in every link, and add a one-line subtitle distinguishing them at each entry point.
**Files:** `(tabs)/index.tsx`, `(tabs)/program.tsx`, `(tabs)/tools.tsx`.

---

## Workstream C — Home dashboard

### C1. Strengthen header hierarchy — P1, S
**What:** The Home title "Your Plan" is only **15px**, while every other tab title is **26px**. The greeting above it is 11px. Home — the most important screen — has the weakest title.
**Why:** Inverted hierarchy; the landing screen reads as less important than secondary tabs.
**Fix:** Promote "Your Plan" to the 26px tab-title scale (or make the greeting the primary line at ~20px). Align with the other tab headers.
**Files:** `(tabs)/index.tsx:355-356`.

### C2. Reduce stat-card density — P1, M
**What:** Below the readiness hero, Home stacks 6 summary tiles across 3 rows (Total Debt, Settlement Target, Monthly Savings, Program Length, Creditors, Credit Score) plus the program card, next priority, and quick actions. The hero already answers the key question; the 6 tiles compete with it.
**Why:** Cognitive overload; the emotionally important "am I ready?" hero gets diluted.
**Fix:** Collapse to the 2–3 stats that support the hero (e.g. Total Debt, Projected Savings, Program Length); move the rest (Creditors count, Credit Score) into their owning screens. Consider a "Details" disclosure.
**Files:** `(tabs)/index.tsx:172-218`.

### C3. Resolve tier-card / quick-action duplication — P2, S
**What:** Free users see a full-width "Unlock AI tools" promo *and* an "AI Strategy" quick action that also routes to `/pricing`. Two CTAs for the same upsell on one screen.
**Why:** Repetition reads as nagging and clutters quick actions.
**Fix:** For free tier, drop "AI Strategy" from Quick Actions (or swap for a non-gated action like "Log a call"); keep the single promo card.
**Files:** `(tabs)/index.tsx:298-302`.

---

## Workstream D — Onboarding

### D1. Don't truncate feature bullets — P1, S
**What:** Welcome feature rows use `numberOfLines={1}` (`onboarding/index.tsx:50`); "Build a customized debt program" can clip on smaller devices.
**Why:** Truncated value props on the very first screen hurt conversion.
**Fix:** Remove `numberOfLines`, allow wrap; the layout already uses `flex`.
**Files:** `onboarding/index.tsx`.

### D2. Lighten Step 1 cognitive load — P1, M
**What:** Step 1 asks for name, total debt, monthly savings, saved-so-far, and settlement % on one screen, with a long live-estimate stack that grows to 3 nested calculations.
**Why:** Heavy first interaction; the live panel competes for attention while typing.
**Fix:** Keep inputs grouped, but (a) collapse the estimate into a single sticky summary line that expands on tap, and (b) consider deferring "saved so far" + settlement % to step 2 so step 1 is just name/debt/savings. Enlarge the progress dots (currently 8px) for clearer step affordance.
**Files:** `onboarding/step1.tsx`.

---

## Workstream E — Forms (Add/Edit Creditor, Profile)

### E1. Explain why "Save" is disabled — P1, S
**What:** Add Creditor's Save button is silently disabled until name + balance are valid (`creditor/add.tsx:43`), with no inline hint.
**Why:** Users don't know what's missing; disabled-with-no-reason is a known friction pattern.
**Fix:** Show inline field validation (e.g. "Name required") on blur, or a helper line under the button. Keep autofocus.
**Files:** `creditor/add.tsx`, `creditor/edit/[id].tsx`.

### E2. Format the phone input — P1, S
**What:** Phone field accepts raw input with no mask (`creditor/add.tsx:94`).
**Why:** Inconsistent stored/displayed numbers; minor polish that signals quality.
**Fix:** Apply a lightweight US phone mask on change (mirror `formatMoneyInput` pattern in `utils/calculations`).
**Files:** `creditor/add.tsx`, `utils/calculations.ts`.

### E3. Reduce settlement-% indirection — P1, S
**What:** Add Creditor shows the target as read-only with "Change in Settings" → `/profile` (`creditor/add.tsx:125-133`). Editing the program-wide % requires leaving the form and losing context.
**Why:** Context switch mid-task; users expect to adjust inline.
**Fix:** Either make the inline row open a bottom-sheet `<SegmentedPercent>` (A4) in place, or clearly frame it as "Program target (applies to all): 50%" so the indirection is understood, not surprising.
**Files:** `creditor/add.tsx`, `profile.tsx`.

### E4. Use tokens, not hardcoded border hex — P0, S
**What:** `profile.tsx` hardcodes `borderBottomColor: "#E8E8E8"` in styles (`:385`, `:392`) instead of `colors.border`.
**Why:** Breaks under theming (A3) and diverges if the token changes.
**Fix:** Replace with `colors.border` via inline style.
**Files:** `profile.tsx`.

---

## Workstream F — Loading, empty & error states

### F1. Use the existing Skeleton on data screens — P1, M
**What:** A `Skeleton` component exists but data-driven screens (Home, Creditors, Program) render directly off react-query without loading states, risking an empty flash before hydration.
**Why:** Perceived performance + avoids layout jump.
**Fix:** Add skeleton placeholders for the readiness hero, stat tiles, and creditor list while `isLoading`.
**Files:** `components/Skeleton.tsx`, `(tabs)/index.tsx`, `(tabs)/creditors.tsx`, `(tabs)/program.tsx`.

### F2. Fix Home empty-state container height — P1, S
**What:** On Home the `EmptyState` (which is `flex:1`-centered) is wrapped in a fixed `height: 400` box (`emptyWrapper`, `index.tsx:359`), which can crop oddly across device sizes.
**Why:** Inconsistent vertical centering / potential clipping.
**Fix:** Let the empty state fill available space (flex) instead of a fixed height.
**Files:** `(tabs)/index.tsx`.

---

## Workstream G — Component polish

### G1. Reconsider primary-button text shadow — P2, S
**What:** Primary buttons apply a brown `textShadow` (`Button.tsx:107-111`).
**Why:** Can look muddy/dated against the flat orange; reduces label crispness.
**Fix:** Remove or reduce to a very subtle shadow; verify contrast of white-on-orange (passes) without it.
**Files:** `components/Button.tsx`.

### G2. Add Button size variants + min touch target audit — P2, S
**What:** Inline text links ("View Tracker", "Full Timeline", subscription links) are small tappable `Text` with no min target; profile icon button is ~28px.
**Why:** Sub-44px targets fail HIG/Material guidance.
**Fix:** Add `hitSlop` or padding to reach 44×44 on all tap targets; consider a small `Button` size variant for inline actions.
**Files:** `(tabs)/index.tsx`, `profile.tsx`, `components/Button.tsx`.

---

## Suggested phased rollout

**Phase 1 — Trust & accessibility (P0, mostly S):** B1 (50% badge), A2 (contrast), E4 (token border), A5 (a11y labels). Low risk, high credibility. ~half a day.

**Phase 2 — High-impact quick wins (P1, S):** C1 (header), B2 (progress bar), D1 (truncation), F2 (empty state), E1/E2/E3 (forms). ~1 day.

**Phase 3 — Structural UX (P1, M):** B3 (IA/naming), C2 (density), D2 (onboarding load), F1 (skeletons), A4 (shared controls). ~2–3 days.

**Phase 4 — Foundations & polish (P1–P2, L):** A1 (scale tokens), A3 (dark mode decision), G1/G2 (button polish), C3 (dedupe upsell). Schedule as a dedicated refactor.

---

## Verification

- Manual pass on iOS + Android, small + large device, after each phase.
- Re-check contrast with a WCAG tool after A2.
- VoiceOver/TalkBack sweep after A5.
- Screenshot diff of Home, Onboarding, Add Creditor, Profile before/after.
- No behavior/calculation changes except B1 (correctness fix) and B2 (intentional).

## Out of scope (flag for product)
- Per-creditor savings allocation model (needed before B2 can show real progress).
- Whether Program tab and Savings Planner should merge (B3 surfaces the redundancy; the merge is a product call).
