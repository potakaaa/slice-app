# Plan: Lower Placeholder Visibility (Dedicated Placeholder Token)

**Date:** 2026-06-12
**Type:** SIMPLE
**Owner area:** apps/mobile — input UX
**Status:** active

## Problem (UX)

Every `TextInput` placeholder in the app uses `placeholderTextColor={colors.mutedForeground}`
(`#6B6B6B`). On the light input backgrounds (`card #F9F9F9` / `muted #F4F4F4`) that lands at
~4.7:1 contrast — body-text legibility. Real entered text uses `colors.foreground` (`#1A1A1A`),
so a placeholder like `$ 10,000` reads almost identically to a typed value. Users mistake
placeholders for pre-filled real input.

**Goal:** Make placeholders clearly read as hints (lighter than entered text) without weakening
genuine muted text elsewhere.

## Key constraint

`mutedForeground` is NOT placeholder-only. It is also used app-wide for meaningful muted content:
labels, subtitles, hints, disclaimers, and input affixes (`$`, `/mo`). Globally dimming it would
wash out real content. **The fix must introduce a dedicated placeholder token**, not change
`mutedForeground`.

## Decision

- New token `placeholderForeground = #9E9E9E` (~2.7:1 on light input bg — "Subtle", user-approved).
- Single source of truth in `constants/colors.ts`; flows automatically through `useColors()`.
- Entered text (`foreground #1A1A1A`) stays untouched, preserving strong typed-vs-hint distinction.

## Touchpoints

### 1. Add token — `apps/mobile/constants/colors.ts`
In the `light` palette, add after `mutedForeground`:
```ts
placeholderForeground: "#9E9E9E",
```
(No change to `useColors.ts` — it spreads the whole palette, so the token is available as
`colors.placeholderForeground` automatically. If/when a `dark` palette is added later, give it its
own value.)

### 2. Swap all 33 call sites
Mechanical replace of `placeholderTextColor={colors.mutedForeground}` →
`placeholderTextColor={colors.placeholderForeground}`. All 33 occurrences are exactly this
pattern (verified: 0 variants). Files and line counts:

| File | Occurrences |
|---|---|
| `apps/mobile/app/auth.tsx` | 3 |
| `apps/mobile/app/what-if.tsx` | 1 |
| `apps/mobile/app/add-to-fund.tsx` | 1 |
| `apps/mobile/app/coaching.tsx` | 1 |
| `apps/mobile/app/credit-repair.tsx` | 1 |
| `apps/mobile/app/(tabs)/creditors.tsx` | 1 |
| `apps/mobile/app/profile.tsx` | 2 |
| `apps/mobile/app/creditor/add.tsx` | 4 |
| `apps/mobile/app/creditor/log-call/[id].tsx` | 2 |
| `apps/mobile/app/creditor/[id].tsx` | 1 |
| `apps/mobile/app/creditor/edit/[id].tsx` | 4 |
| `apps/mobile/app/calculator.tsx` | 2 |
| `apps/mobile/app/onboarding/step1.tsx` | 4 |
| `apps/mobile/app/onboarding/step2.tsx` | 3 |
| `apps/mobile/app/onboarding/step3.tsx` | 3 |
| **Total** | **33** |

> Note: only swap the **placeholder** usages. Do NOT touch `{ color: colors.mutedForeground }`
> style usages (labels/affixes/disclaimers) — those stay as-is.

## Blast radius

- Visual-only change to placeholder rendering. No logic, state, navigation, or data touched.
- `mutedForeground` retains all its existing non-placeholder uses unchanged.
- Low risk; fully reversible (revert token + swaps).

## Verification

1. Run the mobile app.
2. Inspect input-heavy screens: `auth`, `onboarding/step1–3`, `creditor/add`, `creditor/edit/[id]`,
   `calculator`, `(tabs)/creditors`, `add-to-fund`, `what-if`, `coaching`, `credit-repair`, `profile`.
3. Confirm: placeholders read as faint hints, clearly lighter than typed text; the `$`/`/mo` affixes
   and labels/disclaimers remain at their current (darker) `mutedForeground` shade.
4. Type into a money field — entered value should look noticeably bolder/darker than the placeholder it replaced.

## Out of scope

- Dark-mode placeholder token (no `dark` palette exists yet).
- Restyling labels, hints, or affixes.
- Any input layout/border/background changes.

## Resume handoff

If interrupted: the only stateful step is adding the token (step 1). Step 2 is a find/replace of a
single exact string across the 15 files listed. `grep -rn "placeholderTextColor={colors.mutedForeground}"`
returning 0 results = swap complete.
