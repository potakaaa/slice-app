import test from "node:test";
import assert from "node:assert/strict";

import {
  getFollowUpDateISO,
  outcomeMarksSettled,
  OUTCOME_LABELS,
} from "../utils/calculations";

test("follow-up 'none' yields null", () => {
  assert.equal(getFollowUpDateISO("none"), null);
});

test("follow-up '1w' is 7 days out in ISO yyyy-mm-dd form", () => {
  const expected = new Date();
  expected.setDate(expected.getDate() + 7);
  assert.equal(getFollowUpDateISO("1w"), expected.toISOString().slice(0, 10));
});

test("follow-up '2w' is 14 days out", () => {
  const expected = new Date();
  expected.setDate(expected.getDate() + 14);
  assert.equal(getFollowUpDateISO("2w"), expected.toISOString().slice(0, 10));
});

test("follow-up '1m' advances one month", () => {
  const expected = new Date();
  expected.setMonth(expected.getMonth() + 1);
  assert.equal(getFollowUpDateISO("1m"), expected.toISOString().slice(0, 10));
});

test("only an accepted offer marks the creditor settled", () => {
  assert.equal(outcomeMarksSettled("offer_accepted"), true);
  assert.equal(outcomeMarksSettled("offer_rejected"), false);
  assert.equal(outcomeMarksSettled("counter_offered"), false);
  assert.equal(outcomeMarksSettled("no_answer"), false);
});

test("every outcome has a human label", () => {
  for (const outcome of Object.keys(OUTCOME_LABELS)) {
    assert.ok(OUTCOME_LABELS[outcome as keyof typeof OUTCOME_LABELS].length > 0);
  }
});
