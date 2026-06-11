import assert from "node:assert/strict";
import test from "node:test";

import { nextCopyIndex, poolLength, resolveCopy } from "./celebrationCopy";

test("nextCopyIndex advances and wraps without repeating the previous index", () => {
  // 2-entry pool: 0 -> 1 -> 0 -> 1 ...
  assert.equal(nextCopyIndex(2, undefined), 0);
  assert.equal(nextCopyIndex(2, 0), 1);
  assert.equal(nextCopyIndex(2, 1), 0);
});

test("nextCopyIndex never returns the previous index for multi-entry pools", () => {
  for (let len = 2; len <= 5; len++) {
    for (let last = 0; last < len; last++) {
      assert.notEqual(nextCopyIndex(len, last), last, `len=${len} last=${last}`);
    }
  }
});

test("nextCopyIndex is always 0 for single-entry pools", () => {
  assert.equal(nextCopyIndex(1, undefined), 0);
  assert.equal(nextCopyIndex(1, 0), 0);
});

test("rotating a 3-entry pool cycles through every variant", () => {
  const len = 3;
  const seen = new Set<number>();
  let idx: number | undefined;
  for (let i = 0; i < len; i++) {
    idx = nextCopyIndex(len, idx);
    seen.add(idx);
  }
  assert.equal(seen.size, len);
});

test("pride voice appends the support line; encourage does not", () => {
  const pride = resolveCopy("m3_first_creditor", 0);
  assert.equal(pride.voice, "pride");
  assert.match(pride.message, /support you every step of the way\.$/);

  const encourage = resolveCopy("m2_fund_setup", 0);
  assert.equal(encourage.voice, "encourage");
  assert.doesNotMatch(encourage.message, /support you every step of the way/);
});

test("hero voice appends the support line and is the hero tier", () => {
  const hero = resolveCopy("m19_debt_free", 0);
  assert.equal(hero.tier, "hero");
  assert.equal(hero.voice, "hero");
  assert.match(hero.message, /support you every step of the way\.$/);
});

test("welcome voice (upgrades) never uses pride language", () => {
  const welcome = resolveCopy("upgrade_silver", 0);
  assert.equal(welcome.voice, "welcome");
  assert.doesNotMatch(welcome.message, /proud of you/i);
  assert.doesNotMatch(welcome.message, /support you every step of the way/);
});

test("resolveCopy wraps out-of-range and negative indices safely", () => {
  const len = poolLength("m3_first_creditor");
  const wrapped = resolveCopy("m3_first_creditor", len); // == index 0
  const zero = resolveCopy("m3_first_creditor", 0);
  assert.equal(wrapped.title, zero.title);

  // Negative index must not throw and must resolve to a real variant.
  const neg = resolveCopy("m3_first_creditor", -1);
  assert.ok(neg.title.length > 0);
});

test("micro milestones resolve to the micro tier", () => {
  for (const key of ["m2_fund_setup", "m4_goal", "m9_what_if", "m15_follow_up"] as const) {
    assert.equal(resolveCopy(key, 0).tier, "micro");
  }
});
