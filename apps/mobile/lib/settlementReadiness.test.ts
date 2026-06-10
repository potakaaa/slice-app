import test from "node:test";
import assert from "node:assert/strict";

import {
  calcSettlementReadiness,
  getPriorityCreditor,
  getNextBestMove,
} from "../utils/calculations";
import type { Creditor } from "../types";

function makeCreditor(overrides: Partial<Creditor> = {}): Creditor {
  return {
    id: overrides.id ?? "c1",
    name: overrides.name ?? "Capital One",
    phone: overrides.phone ?? "",
    balance: overrides.balance ?? 6000,
    settlementPercentage: overrides.settlementPercentage ?? 0.3,
    monthlySavings: overrides.monthlySavings ?? 0,
    status: overrides.status ?? "active",
    notes: overrides.notes ?? "",
    priority: overrides.priority ?? 0,
    addedAt: overrides.addedAt ?? new Date().toISOString(),
  };
}

test("no creditors yields an empty status", () => {
  const r = calcSettlementReadiness([], 0, 400);
  assert.equal(r.status, "empty");
  assert.equal(r.priorityCreditor, null);
  assert.equal(r.daysUntilReady, null);
});

test("first offer target = balance * settlement percentage", () => {
  const r = calcSettlementReadiness([makeCreditor({ balance: 6000, settlementPercentage: 0.3 })], 0, 400);
  assert.equal(r.firstOfferTarget, 1800);
});

test("ready now when saved cash >= first offer target", () => {
  const r = calcSettlementReadiness([makeCreditor({ balance: 6000, settlementPercentage: 0.3 })], 1800, 400);
  assert.equal(r.status, "ready");
  assert.equal(r.isReadyNow, true);
  assert.equal(r.remainingNeeded, 0);
  assert.equal(r.daysUntilReady, 0);
  assert.equal(r.progress, 1);
});

test("days-until-ready uses a daily set-aside derived from the monthly amount", () => {
  // target 1800, saved 900 -> need 900; 400/mo -> ~13.14/day -> ceil(900/13.14) = 69 days
  const r = calcSettlementReadiness([makeCreditor({ balance: 6000, settlementPercentage: 0.3 })], 900, 400);
  assert.equal(r.remainingNeeded, 900);
  assert.equal(r.daysUntilReady, Math.ceil(900 / (400 / 30.44)));
  assert.equal(r.daysUntilReady, 69);
  assert.equal(r.status, "on_track");
});

test("zero monthly set-aside that is not ready needs input", () => {
  const r = calcSettlementReadiness([makeCreditor({ balance: 6000, settlementPercentage: 0.3 })], 500, 0);
  assert.equal(r.status, "needs_input");
  assert.equal(r.needsMonthlySetAside, true);
  assert.equal(r.daysUntilReady, null);
});

test("fees and emergency buffer raise the target", () => {
  const base = calcSettlementReadiness([makeCreditor({ balance: 6000, settlementPercentage: 0.3 })], 0, 400);
  const withExtras = calcSettlementReadiness(
    [makeCreditor({ balance: 6000, settlementPercentage: 0.3 })],
    0,
    400,
    { estimatedFees: 200, emergencyBuffer: 100 }
  );
  assert.equal(base.firstOfferTarget, 1800);
  assert.equal(withExtras.firstOfferTarget, 2100);
});

test("priority creditor is the smallest active balance (snowball)", () => {
  const creditors = [
    makeCreditor({ id: "big", balance: 9000 }),
    makeCreditor({ id: "small", balance: 2000 }),
    makeCreditor({ id: "settled", balance: 500, status: "settled" }),
  ];
  const priority = getPriorityCreditor(creditors);
  assert.equal(priority?.id, "small");
});

test("almost-ready within two weeks reports the almost status", () => {
  // target 1800, saved 1750 -> need 50; 400/mo -> ~13.14/day -> ceil(50/13.14) = 4 days
  const r = calcSettlementReadiness([makeCreditor({ balance: 6000, settlementPercentage: 0.3 })], 1750, 400);
  assert.equal(r.status, "almost");
  assert.ok(r.daysUntilReady !== null && r.daysUntilReady <= 14);
});

test("next best move points to script generation when ready", () => {
  const r = calcSettlementReadiness([makeCreditor({ id: "c9", name: "Chase" })], 999999, 400);
  const move = getNextBestMove(r);
  assert.equal(move.route, "/ai/script/c9");
  assert.match(move.label, /Chase/);
});

test("next best move prompts to add a creditor when empty", () => {
  const move = getNextBestMove(calcSettlementReadiness([], 0, 400));
  assert.equal(move.route, "/creditor/add");
});
