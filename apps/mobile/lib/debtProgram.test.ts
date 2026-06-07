import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSimpleDebtProgram,
  calcProgramLength,
  calcSimpleProgramSettlementAmount,
  SIMPLE_PROGRAM_SETTLEMENT_RATE,
} from "../utils/calculations";

test("simple debt program uses a fixed 50% settlement rate", () => {
  assert.equal(SIMPLE_PROGRAM_SETTLEMENT_RATE, 0.5);
  assert.equal(calcSimpleProgramSettlementAmount(10000), 5000);
});

test("program length rounds up with Math.ceil", () => {
  assert.equal(calcProgramLength(5000, 600), 9);
});

test("zero monthly savings yields no tracker months", () => {
  const program = buildSimpleDebtProgram(10000, 0);

  assert.equal(program.estimatedSettlementAmount, 5000);
  assert.equal(program.programLengthMonths, 0);
});
