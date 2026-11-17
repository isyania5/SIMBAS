import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDepositValue,
  formatWeightMilli,
  parseWeightMilli,
} from "./money";

test("parses decimal kilogram weights to exact thousandths", () => {
  assert.equal(parseWeightMilli("3"), 3000);
  assert.equal(parseWeightMilli("1.025"), 1025);
  assert.equal(parseWeightMilli("0.001"), 1);
  assert.equal(formatWeightMilli(1200), "1.2");
});

test("rejects invalid, zero, and over-precision weights", () => {
  assert.equal(parseWeightMilli("0"), null);
  assert.equal(parseWeightMilli("-1"), null);
  assert.equal(parseWeightMilli("1.0001"), null);
  assert.equal(parseWeightMilli("1,5"), null);
});

test("calculates deposit Rupiah with integer half-up rounding", () => {
  assert.equal(calculateDepositValue(3000, 2000), 6000);
  assert.equal(calculateDepositValue(1, 500), 1);
  assert.throws(() => calculateDepositValue(1, 499), /minimal Rp1/);
  assert.throws(() => calculateDepositValue(1_000_000_000, 2_000_000_000), /batas/);
});
