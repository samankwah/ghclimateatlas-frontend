import assert from "node:assert/strict";
import test from "node:test";

import {
  formatLegendTick,
  getUniqueDisplayedTicks,
} from "../src/utils/legendTicks.ts";

test("keeps ordinary whole-number legend labels unique", () => {
  const ticks = getUniqueDisplayedTicks(
    [500, 900, 1300, 1700, 2100, 2500],
    "precipitation",
    false,
  );

  assert.deepEqual(ticks.map((tick) => tick.label), [
    "500",
    "900",
    "1300",
    "1700",
    "2100",
    "2500",
  ]);
});

test("removes repeated rounded labels while preserving distinct endpoints", () => {
  const ticks = getUniqueDisplayedTicks(
    [0.2, 0.6, 0.8, 1.2],
    "temperature",
    false,
  );

  assert.deepEqual(ticks, [
    { value: 0.2, label: "0" },
    { value: 1.2, label: "1" },
  ]);
});

test("collapses a range that formats to one label", () => {
  const ticks = getUniqueDisplayedTicks(
    [24.1, 24.2, 24.3, 24.4],
    "temperature",
    false,
  );

  assert.deepEqual(ticks, [{ value: 24.1, label: "24" }]);
});

test("retains sea-level precision and unique labels", () => {
  const ticks = getUniqueDisplayedTicks(
    [0, 0.1, 0.2, 0.3],
    "sea_level",
    false,
  );

  assert.deepEqual(ticks.map((tick) => tick.label), ["0.0", "0.1", "0.2", "0.3"]);
});

test("normalizes rounded zero labels in change mode", () => {
  assert.equal(formatLegendTick(-0.4, "diverging", true), "0");
  assert.equal(formatLegendTick(0.4, "diverging", true), "0");
  assert.deepEqual(
    getUniqueDisplayedTicks([-0.4, 0, 0.4], "diverging", true),
    [{ value: -0.4, label: "0" }],
  );
  assert.deepEqual(
    getUniqueDisplayedTicks([-0.6, 0, 0.6], "diverging", true).map((tick) => tick.label),
    ["-1", "0", "+1"],
  );
});

test("keeps enough unique change boundaries to explain diverging map colors", () => {
  const ticks = getUniqueDisplayedTicks(
    [-26, -17, -9, 0, 9, 17, 26],
    "diverging_precip",
    true,
  );

  assert.deepEqual(ticks.map((tick) => tick.label), [
    "-26",
    "-17",
    "-9",
    "0",
    "+9",
    "+17",
    "+26",
  ]);
});
